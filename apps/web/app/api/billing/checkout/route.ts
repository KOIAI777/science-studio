import {NextResponse} from "next/server";
import {createAdminClient, isSupabaseAdminConfigured} from "../../../../lib/supabase/admin";
import {getSiteUrl} from "../../../../lib/supabase/config";
import {createClient} from "../../../../lib/supabase/server";
import {
  getWaffoClient,
  MIDDLE_SCHOOL_PACK_PRICE_USD,
  MIDDLE_SCHOOL_PACK_PRODUCT_ID,
  MIDDLE_SCHOOL_PACK_SKU,
} from "../../../../lib/waffo";

function redirectToPaywall(request: Request, error?: string) {
  const url = new URL("/experiments/dc-circuits", request.url);
  if (error) url.searchParams.set("billing", error);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {data: userData} = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return redirectToPaywall(request, "login");

  if (!isSupabaseAdminConfigured()) return redirectToPaywall(request, "configuration");

  const admin = createAdminClient();
  const {data: existingEntitlement} = await admin
    .from("entitlements")
    .select("status")
    .eq("user_id", user.id)
    .eq("sku", MIDDLE_SCHOOL_PACK_SKU)
    .eq("status", "active")
    .maybeSingle();
  if (existingEntitlement) return redirectToPaywall(request);

  const internalOrderId = crypto.randomUUID();
  const {error: orderError} = await admin.from("orders").insert({
    id: internalOrderId,
    user_id: user.id,
    sku: MIDDLE_SCHOOL_PACK_SKU,
    provider_product_id: MIDDLE_SCHOOL_PACK_PRODUCT_ID,
    currency: "USD",
    amount: MIDDLE_SCHOOL_PACK_PRICE_USD,
    buyer_email: user.email ?? null,
    metadata: {source: "dc-circuits-paywall"},
  });
  if (orderError) {
    console.error("Failed to create billing order", orderError);
    return redirectToPaywall(request, "order");
  }

  try {
    const session = await getWaffoClient().checkout.authenticated.create({
      productId: MIDDLE_SCHOOL_PACK_PRODUCT_ID,
      currency: "USD",
      buyerIdentity: user.id,
      buyerEmail: user.email ?? undefined,
      orderMerchantExternalId: internalOrderId,
      metadata: {sku: MIDDLE_SCHOOL_PACK_SKU, internalOrderId},
      successUrl: `${getSiteUrl()}/checkout/success?order=${encodeURIComponent(internalOrderId)}`,
      language: "en",
      darkMode: false,
    });

    const {error: sessionError} = await admin
      .from("orders")
      .update({provider_session_id: session.sessionId})
      .eq("id", internalOrderId);
    if (sessionError) console.error("Failed to persist Waffo session", sessionError);

    return NextResponse.redirect(session.checkoutUrl, 303);
  } catch (error) {
    console.error("Failed to create Waffo checkout", error);
    await admin.from("orders").update({status: "failed"}).eq("id", internalOrderId);
    return redirectToPaywall(request, "checkout");
  }
}
