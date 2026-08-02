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

const PACK_EXPERIMENT_PATHS = new Set([
  "/experiments/dc-circuits",
  "/experiments/waves",
  "/experiments/density-buoyancy",
  "/experiments/momentum-collisions",
  "/experiments/refraction-total-internal-reflection",
  "/experiments/levers-and-balance",
  "/experiments/sound-waves",
  "/experiments/electrical-power-energy",
  "/experiments/electromagnets",
  "/experiments/lenses-image-formation",
]);

function normalizeReturnTo(value: FormDataEntryValue | string | null | undefined) {
  return typeof value === "string" && PACK_EXPERIMENT_PATHS.has(value)
    ? value
    : "/experiments/dc-circuits";
}

function redirectToPaywall(request: Request, returnTo: string, error?: string) {
  const url = new URL(returnTo, request.url);
  if (error) url.searchParams.set("billing", error);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const returnTo = normalizeReturnTo(formData.get("returnTo"));
  const supabase = await createClient();
  const {data: userData} = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return redirectToPaywall(request, returnTo, "login");

  if (!isSupabaseAdminConfigured()) return redirectToPaywall(request, returnTo, "configuration");

  const admin = createAdminClient();
  const {data: existingEntitlement} = await admin
    .from("entitlements")
    .select("status")
    .eq("user_id", user.id)
    .eq("sku", MIDDLE_SCHOOL_PACK_SKU)
    .eq("status", "active")
    .maybeSingle();
  if (existingEntitlement) return redirectToPaywall(request, returnTo);

  const internalOrderId = crypto.randomUUID();
  const {error: orderError} = await admin.from("orders").insert({
    id: internalOrderId,
    user_id: user.id,
    sku: MIDDLE_SCHOOL_PACK_SKU,
    provider_product_id: MIDDLE_SCHOOL_PACK_PRODUCT_ID,
    currency: "USD",
    amount: MIDDLE_SCHOOL_PACK_PRICE_USD,
    buyer_email: user.email ?? null,
    metadata: {source: `${returnTo.slice("/experiments/".length)}-paywall`, returnTo},
  });
  if (orderError) {
    console.error("Failed to create billing order", orderError);
    return redirectToPaywall(request, returnTo, "order");
  }

  try {
    const session = await getWaffoClient().checkout.authenticated.create({
      productId: MIDDLE_SCHOOL_PACK_PRODUCT_ID,
      currency: "USD",
      buyerIdentity: user.id,
      buyerEmail: user.email ?? undefined,
      orderMerchantExternalId: internalOrderId,
      metadata: {sku: MIDDLE_SCHOOL_PACK_SKU, internalOrderId},
      successUrl: `${getSiteUrl()}/checkout/success?order=${encodeURIComponent(internalOrderId)}&next=${encodeURIComponent(returnTo)}`,
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
    return redirectToPaywall(request, returnTo, "checkout");
  }
}
