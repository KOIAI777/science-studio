import type {Metadata} from "next";
import {Check, Clock3, FlaskConical, RefreshCw} from "lucide-react";
import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "../../../lib/supabase/server";

export const metadata: Metadata = {
  title: "Payment status",
  robots: {index: false, follow: false},
};

interface CheckoutSuccessPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function experimentPath(value: string | undefined) {
  return value === "/experiments/waves" || value === "/experiments/density-buoyancy" || value === "/experiments/momentum-collisions" || value === "/experiments/refraction-total-internal-reflection" || value === "/experiments/levers-and-balance" || value === "/experiments/sound-waves" || value === "/experiments/electrical-power-energy" || value === "/experiments/electromagnets" || value === "/experiments/lenses-image-formation"
    ? value
    : "/experiments/dc-circuits";
}

function experimentLabel(path: string) {
  if (path === "/experiments/waves") return "Open Waves";
  if (path === "/experiments/density-buoyancy") return "Open Density & Buoyancy";
  if (path === "/experiments/momentum-collisions") return "Open Momentum & Collisions";
  if (path === "/experiments/refraction-total-internal-reflection") return "Open Refraction & Total Internal Reflection";
  if (path === "/experiments/levers-and-balance") return "Open Levers & Balance";
  if (path === "/experiments/sound-waves") return "Open Sound Waves";
  if (path === "/experiments/electrical-power-energy") return "Open Electrical Power & Energy";
  if (path === "/experiments/electromagnets") return "Open Electromagnets";
  if (path === "/experiments/lenses-image-formation") return "Open Lenses & Image Formation";
  return "Open DC Circuits";
}

export default async function CheckoutSuccessPage({searchParams}: CheckoutSuccessPageProps) {
  const params = await searchParams;
  const orderId = first(params.order);
  const next = experimentPath(first(params.next));
  if (!orderId || !/^[0-9a-f-]{36}$/i.test(orderId)) redirect("/experiments");

  const supabase = await createClient();
  const {data: userData} = await supabase.auth.getUser();
  if (!userData.user) redirect(`/login?next=${encodeURIComponent(`/checkout/success?order=${orderId}`)}`);

  const {data: order} = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .eq("user_id", userData.user.id)
    .maybeSingle();

  const completed = order?.status === "completed";
  return (
    <main className="checkout-status-page">
      <div className="checkout-status-panel">
        <Link className="checkout-status-brand" href="/"><span><FlaskConical size={17} /></span><strong>Science Studio</strong></Link>
        <div className={`checkout-status-icon ${completed ? "complete" : "pending"}`}>{completed ? <Check size={24} /> : <Clock3 size={24} />}</div>
        <span className="section-kicker">{completed ? "Access ready" : "Payment received"}</span>
        <h1>{completed ? "Your experiment pack is ready." : "We are confirming your payment."}</h1>
        <p>{completed ? "Middle School Physics Foundations is now linked to your teacher account." : "Waffo has redirected you back. Access will appear as soon as the signed payment event is processed."}</p>
        <div className="checkout-status-actions">
          {completed ? <Link className="checkout-primary-action" href={next}>{experimentLabel(next)}</Link> : <Link className="checkout-primary-action" href={`/checkout/success?order=${orderId}&next=${encodeURIComponent(next)}`}><RefreshCw size={15} />Refresh status</Link>}
          <Link className="checkout-secondary-action" href="/account">Open account</Link>
        </div>
      </div>
    </main>
  );
}
