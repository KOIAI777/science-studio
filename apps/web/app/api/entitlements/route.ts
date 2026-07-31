import {NextResponse} from "next/server";
import {createClient} from "../../../lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {data: claimsData} = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return NextResponse.json({entitlements: []}, {status: 401});

  const {data, error} = await supabase
    .from("entitlements")
    .select("sku, status, granted_at, revoked_at")
    .eq("user_id", userId)
    .eq("status", "active");
  if (error) return NextResponse.json({error: "Unable to load entitlements"}, {status: 500});
  return NextResponse.json({entitlements: data ?? []});
}
