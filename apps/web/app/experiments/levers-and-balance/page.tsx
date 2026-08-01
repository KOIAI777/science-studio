import type {Metadata} from "next";
import {ArrowLeft, BookOpenCheck, Calculator, CreditCard, FlaskConical, Gauge, LockKeyhole, MonitorPlay, RotateCcw, Ruler, ShieldCheck, SlidersHorizontal, UserRound} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {ExperimentStructuredData} from "../../../components/experiment-structured-data";
import {LeverBalanceWorkbench} from "../../../components/lever-balance-workbench";
import {isSupabaseAdminConfigured} from "../../../lib/supabase/admin";
import {isLocalPaidExperimentPreviewEnabled, isSupabaseConfigured} from "../../../lib/supabase/config";
import {createClient} from "../../../lib/supabase/server";
import {MIDDLE_SCHOOL_PACK_PRICE_USD, MIDDLE_SCHOOL_PACK_SKU} from "../../../lib/waffo";

const pageTitle = "Levers & Balance: Moments in Equilibrium";
const socialTitle = `${pageTitle} | Science Studio`;
const description = "Compare clockwise and counterclockwise moments about a central pivot, predict the initial direction, and solve missing masses or lever arms for equilibrium.";
const previewImage = {
  url: "/experiments/levers-and-balance-classroom-diagram.png",
  width: 1200,
  height: 675,
  alt: "Science Studio lever balance experiment showing a horizontal ruler beam, two loads, weight arrows, perpendicular lever arms, and opposing moments",
};

export const metadata: Metadata = {
  title: pageTitle,
  description,
  robots: {index: true, follow: true},
  alternates: {canonical: "/experiments/levers-and-balance"},
  openGraph: {type: "website", title: socialTitle, description, url: "/experiments/levers-and-balance", images: [previewImage]},
  twitter: {card: "summary_large_image", title: socialTitle, description, images: [previewImage.url]},
};

interface LeversPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LeversExperimentPage({searchParams}: LeversPageProps) {
  const params = await searchParams;
  const forceOfferPreview = process.env.NODE_ENV === "development" && first(params.preview) === "offer";
  if (isLocalPaidExperimentPreviewEnabled() && !forceOfferPreview) return <LeverBalanceWorkbench />;

  let userId: string | undefined;
  let hasAccess = false;
  if (isSupabaseConfigured() && !forceOfferPreview) {
    const supabase = await createClient();
    const {data: claimsData} = await supabase.auth.getClaims();
    userId = claimsData?.claims?.sub;
    if (userId) {
      const {data: entitlement} = await supabase.from("entitlements").select("status").eq("user_id", userId).eq("sku", MIDDLE_SCHOOL_PACK_SKU).eq("status", "active").maybeSingle();
      hasAccess = entitlement?.status === "active";
    }
  }

  if (hasAccess) return <LeverBalanceWorkbench />;

  const billingMessage = first(params.billing);
  return <main className="pack-access-page">
    <ExperimentStructuredData name={pageTitle} description={description} path="/experiments/levers-and-balance" image={previewImage.url} teaches={["Moment of a force", "Clockwise and counterclockwise moments", "Perpendicular distance", "Principle of moments", "Rotational equilibrium"]} lessonMinutes={15} isFree={false} price={MIDDLE_SCHOOL_PACK_PRICE_USD} />
    <header className="site-header"><div className="site-header-inner"><Link className="site-brand" href="/" aria-label="Science Studio home"><span className="brand-mark"><FlaskConical size={17} /></span><strong>Science Studio</strong></Link><nav className="site-nav" aria-label="Primary navigation"><Link className="active" href="/experiments">Experiment library</Link><Link href="/#pricing">Pricing</Link></nav><div className="site-actions"><Link className="header-account-link" href="/account"><UserRound size={15} /><span>Account</span></Link></div></div></header>
    <div className="pack-access-main">
      <div className="library-breadcrumb"><Link href="/experiments"><ArrowLeft size={14} />Experiment library</Link><span>/</span><span>Levers &amp; Balance</span></div>
      <section className="pack-access-layout">
        <div className="pack-access-copy"><span className="section-kicker"><LockKeyhole size={14} />Middle School Physics Foundations</span><h1>Levers &amp; Balance</h1><p className="pack-access-lede">Place two loads on a horizontal lever, compare their opposing moments, and turn the setup into a balance question for the class.</p><ul className="pack-access-list"><li><RotateCcw size={15} />Clockwise and counterclockwise moment prediction</li><li><Ruler size={15} />Perpendicular lever arms measured from one pivot</li><li><Calculator size={15} />Live weight, moment, and net-moment calculations</li><li><Gauge size={15} />Balanced, left-down, and right-down classroom presets</li><li><SlidersHorizontal size={15} />Hide a mass or distance, then reveal the solved value</li><li><BookOpenCheck size={15} />Six editable explanation steps for a 15-minute lesson</li><li><MonitorPlay size={15} />16:9 and 9:16 canvases with zoom and fullscreen</li></ul></div>
        <div className="pack-access-card"><div className="pack-price"><strong>${MIDDLE_SCHOOL_PACK_PRICE_USD}</strong><span>one-time early access</span></div><p>Unlock all six released experiments in Middle School Physics Foundations, plus every classroom-ready experiment added to this pack.</p>{billingMessage === "configuration" ? <div className="billing-message">Billing is not configured on this server yet.</div> : billingMessage === "checkout" ? <div className="billing-message">Checkout could not be created. Please try again.</div> : billingMessage === "order" ? <div className="billing-message">We could not start the order. Please try again.</div> : null}{userId ? <form action="/api/billing/checkout" method="post"><input type="hidden" name="returnTo" value="/experiments/levers-and-balance" /><button className="pack-checkout-button" type="submit" disabled={!isSupabaseAdminConfigured()}><CreditCard size={16} />Unlock the pack</button></form> : <Link className="pack-checkout-button" href="/login?next=%2Fexperiments%2Flevers-and-balance"><UserRound size={16} />Sign in to unlock</Link>}<small><ShieldCheck size={13} />No subscription. Refunds are handled by Waffo.</small></div>
      </section>
      <figure className="pack-preview"><Image src={previewImage.url} alt={previewImage.alt} width={previewImage.width} height={previewImage.height} priority /><figcaption><span>Actual experiment output</span><strong>Keep loads, force arrows, perpendicular arms, opposing moments, and the equilibrium calculation visible in one classroom diagram.</strong></figcaption></figure>
    </div>
  </main>;
}
