import type {Metadata} from "next";
import {BookOpen, Check, CircleAlert, Clock3, FlaskConical, RefreshCw, ShieldCheck} from "lucide-react";
import Link from "next/link";
import {redirect} from "next/navigation";
import {CheckoutStatusAutoRefresh} from "../../../components/checkout-status-auto-refresh";
import {createClient} from "../../../lib/supabase/server";

export const metadata: Metadata = {
  title: "Payment status",
  robots: {index: false, follow: false},
};

interface CheckoutSuccessPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

type BillingOrderStatus = "checkout_created" | "completed" | "refunded" | "canceled" | "failed";
type CheckoutViewStatus = BillingOrderStatus | "not_found";
type ProgressState = "complete" | "current" | "error" | "upcoming";

const billingOrderStatuses = new Set<BillingOrderStatus>(["checkout_created", "completed", "refunded", "canceled", "failed"]);

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function billingOrderStatus(value: string | undefined): BillingOrderStatus | undefined {
  return value && billingOrderStatuses.has(value as BillingOrderStatus) ? value as BillingOrderStatus : undefined;
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

function progressIcon(state: ProgressState) {
  if (state === "complete") return <Check size={14} />;
  if (state === "error") return <CircleAlert size={14} />;
  return <Clock3 size={14} />;
}

function CheckoutProgress({status}: {status: CheckoutViewStatus}) {
  const completed = status === "completed";
  const pending = status === "checkout_created";
  const refunded = status === "refunded";
  const verificationState: ProgressState = completed || refunded ? "complete" : pending ? "current" : "error";
  const accessState: ProgressState = completed ? "complete" : pending ? "upcoming" : "error";
  const verificationLabel = completed ? "Signed payment event verified" : refunded ? "Signed refund event verified" : pending ? "Verifying signed payment event" : "Payment was not confirmed";
  const accessLabel = completed ? "Pack access activated" : refunded ? "Pack access removed" : pending ? "Access activates automatically" : "Account access is unchanged";

  return (
    <ol className="checkout-progress" aria-label="Payment activation progress">
      <li className="complete"><span>{progressIcon("complete")}</span><div><small>Step 1</small><strong>Returned from Waffo Pancake</strong></div></li>
      <li className={verificationState} aria-current={verificationState === "current" ? "step" : undefined}><span>{progressIcon(verificationState)}</span><div><small>Step 2</small><strong>{verificationLabel}</strong></div></li>
      <li className={accessState}><span>{progressIcon(accessState)}</span><div><small>Step 3</small><strong>{accessLabel}</strong></div></li>
    </ol>
  );
}

const statusContent: Record<CheckoutViewStatus, {tone: string; kicker: string; title: string; description: string}> = {
  completed: {
    tone: "complete",
    kicker: "Access ready",
    title: "Your experiment pack is ready.",
    description: "The signed payment event has been verified and Middle School Physics Foundations is now linked to your teacher account.",
  },
  checkout_created: {
    tone: "pending",
    kicker: "Confirmation in progress",
    title: "We are confirming your payment.",
    description: "You have returned from Waffo Pancake. Verification normally finishes in a few seconds; do not start another payment while this status is pending.",
  },
  failed: {
    tone: "attention",
    kicker: "Checkout not completed",
    title: "We could not complete this checkout.",
    description: "No experiment access was added. Return to the pack page to try again, or open your account to check existing access.",
  },
  canceled: {
    tone: "attention",
    kicker: "Checkout canceled",
    title: "This checkout was canceled.",
    description: "No payment was confirmed and your current experiment access is unchanged. You can return to the pack whenever you are ready.",
  },
  refunded: {
    tone: "attention",
    kicker: "Order refunded",
    title: "This payment has been refunded.",
    description: "The refund event was verified and access connected to this order is no longer active. Your free experiments remain available.",
  },
  not_found: {
    tone: "attention",
    kicker: "Order unavailable",
    title: "We could not find this order.",
    description: "The link may belong to another account or an unavailable order. Open your account to review active access before trying checkout again.",
  },
};

export default async function CheckoutSuccessPage({searchParams}: CheckoutSuccessPageProps) {
  const params = await searchParams;
  const next = experimentPath(first(params.next));
  const previewStatus = process.env.NODE_ENV === "development" ? billingOrderStatus(first(params.preview)) : undefined;
  const orderId = first(params.order);
  let status: CheckoutViewStatus = previewStatus ?? "not_found";

  if (!previewStatus) {
    if (!orderId || !/^[0-9a-f-]{36}$/i.test(orderId)) redirect("/experiments");

    const supabase = await createClient();
    const {data: userData} = await supabase.auth.getUser();
    const callbackPath = `/checkout/success?order=${orderId}&next=${encodeURIComponent(next)}`;
    if (!userData.user) redirect(`/login?next=${encodeURIComponent(callbackPath)}`);

    const {data: order} = await supabase
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .eq("user_id", userData.user.id)
      .maybeSingle();

    status = billingOrderStatus(order?.status) ?? "not_found";
  }

  const content = statusContent[status];
  const completed = status === "completed";
  const pending = status === "checkout_created";
  const refreshHref = previewStatus
    ? `/checkout/success?preview=${previewStatus}&next=${encodeURIComponent(next)}`
    : `/checkout/success?order=${orderId}&next=${encodeURIComponent(next)}`;

  return (
    <main className="checkout-status-page">
      <div className="checkout-status-panel">
        <Link className="checkout-status-brand" href="/"><span><FlaskConical size={17} /></span><strong>Science Studio</strong></Link>
        <div className={`checkout-status-icon ${content.tone}`}>{completed ? <Check size={24} /> : pending ? <Clock3 size={24} /> : <CircleAlert size={24} />}</div>
        <span className="section-kicker">{content.kicker}</span>
        <h1>{content.title}</h1>
        <p>{content.description}</p>

        <CheckoutProgress status={status} />

        {completed && <div className="checkout-pack-summary"><span><BookOpen size={18} /></span><div><small>Middle School Physics Foundations</small><strong>10 released experiments are ready now</strong><p>Future classroom-ready additions to this Middle School pack are included with your one-time access.</p></div></div>}
        {pending && <CheckoutStatusAutoRefresh enabled={!previewStatus} />}

        <div className="checkout-status-actions">
          {completed ? <Link className="checkout-primary-action" href={next}>{experimentLabel(next)}</Link> : pending ? <Link className="checkout-primary-action" href={refreshHref}><RefreshCw size={15} />Refresh status</Link> : <Link className="checkout-primary-action" href={next}>Return to experiment pack</Link>}
          <Link className="checkout-secondary-action" href={completed ? "/experiments" : "/account"}>{completed ? "Browse all experiments" : "Open account"}</Link>
          <Link className="checkout-tertiary-action" href={completed ? "/account" : "/experiments"}>{completed ? "View account access" : "Back to experiment library"}</Link>
        </div>
        <div className="checkout-support-links"><a href="mailto:billing@classroomlab.online">Billing support</a><span aria-hidden="true">·</span><Link href="/refund-policy">Refund policy</Link><span aria-hidden="true">·</span><Link href="/terms">Terms</Link></div>
        {!previewStatus && orderId && <small className="checkout-order-reference"><ShieldCheck size={12} />Order reference {orderId.slice(0, 8).toUpperCase()}</small>}
      </div>
    </main>
  );
}
