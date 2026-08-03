import type {Metadata} from "next";
import {Activity, ArrowLeft, BookOpenCheck, CreditCard, FlaskConical, Gauge, LockKeyhole, MonitorPlay, ShieldCheck, SlidersHorizontal, TimerReset, UserRound, Zap} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {ElectricalPowerWorkbench} from "../../../components/electrical-power-workbench";
import {ExperimentStructuredData} from "../../../components/experiment-structured-data";
import {isSupabaseAdminConfigured} from "../../../lib/supabase/admin";
import {isLocalPaidExperimentPreviewEnabled, isSupabaseConfigured} from "../../../lib/supabase/config";
import {createClient} from "../../../lib/supabase/server";
import {MIDDLE_SCHOOL_PACK_PRICE_USD, MIDDLE_SCHOOL_PACK_SKU} from "../../../lib/waffo";

const pageTitle = "Electrical Power & Energy";
const socialTitle = `${pageTitle} | Science Studio`;
const description = "Compare two ideal resistive loads, verify equivalent electrical-power equations, and watch energy accumulate over physical time.";
const previewImage = {
  url: "/experiments/electrical-power-energy-classroom-diagram.png",
  width: 1338,
  height: 740,
  alt: "Science Studio electrical power experiment comparing two resistive loads with synchronized power readings and energy-time lines",
};

export const metadata: Metadata = {
  title: pageTitle,
  description,
  robots: {index: true, follow: true},
  alternates: {canonical: "/experiments/electrical-power-energy"},
  openGraph: {type: "website", title: socialTitle, description, url: "/experiments/electrical-power-energy", images: [previewImage]},
  twitter: {card: "summary_large_image", title: socialTitle, description, images: [previewImage.url]},
};

interface ElectricalPowerPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ElectricalPowerExperimentPage({searchParams}: ElectricalPowerPageProps) {
  const params = await searchParams;
  const forceOfferPreview = process.env.NODE_ENV === "development" && first(params.preview) === "offer";
  if (isLocalPaidExperimentPreviewEnabled() && !forceOfferPreview) return <ElectricalPowerWorkbench />;

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

  if (hasAccess) return <ElectricalPowerWorkbench />;

  const billingMessage = first(params.billing);
  return <main className="pack-access-page">
    <ExperimentStructuredData name={pageTitle} description={description} path="/experiments/electrical-power-energy" image={previewImage.url} teaches={["Electrical power", "Electrical energy", "Ohm's law", "Energy transfer", "Watt-hours"]} lessonMinutes={15} isFree={false} price={MIDDLE_SCHOOL_PACK_PRICE_USD} />
    <header className="site-header"><div className="site-header-inner"><Link className="site-brand" href="/" aria-label="Science Studio home"><span className="brand-mark"><FlaskConical size={17} /></span><strong>Science Studio</strong></Link><nav className="site-nav" aria-label="Primary navigation"><Link className="active" href="/experiments">Experiment library</Link><Link href="/#pricing">Pricing</Link></nav><div className="site-actions"><Link className="header-account-link" href="/account"><UserRound size={15} /><span>Account</span></Link></div></div></header>
    <div className="pack-access-main">
      <div className="library-breadcrumb"><Link href="/experiments"><ArrowLeft size={14} />Experiment library</Link><span>/</span><span>Electrical power &amp; energy</span></div>
      <section className="pack-access-layout">
        <div className="pack-access-copy"><span className="section-kicker"><LockKeyhole size={14} />Middle School Physics Foundations</span><h1>Electrical Power &amp; Energy</h1><p className="pack-access-lede">Run two controlled resistive-load experiments on one physical clock. Compare current and power, then read transferred energy from the slope of a synchronized graph.</p><ul className="pack-access-list"><li><Activity size={15} />Two independent ideal-load channels for controlled comparisons</li><li><Gauge size={15} />Live voltage, resistance, current, power, charge, and energy</li><li><TimerReset size={15} />Physical time from 10 to 120 seconds with deterministic accumulation</li><li><Zap size={15} />P = VI = I²R = V²/R and E = Pt from one solver state</li><li><SlidersHorizontal size={15} />Same-voltage, double-voltage, and equal-power presets</li><li><BookOpenCheck size={15} />Six editable explanation steps for a 15-minute lesson</li><li><MonitorPlay size={15} />16:9 and 9:16 canvases with zoom and fullscreen</li></ul></div>
        <div className="pack-access-card"><div className="pack-price"><strong>${MIDDLE_SCHOOL_PACK_PRICE_USD}</strong><span>one-time early access</span></div><p>Unlock all ten released experiments in Middle School Physics Foundations, plus every classroom-ready experiment added to this pack.</p>{billingMessage === "configuration" ? <div className="billing-message">Billing is not configured on this server yet.</div> : billingMessage === "checkout" ? <div className="billing-message">Checkout could not be created. Please try again.</div> : billingMessage === "order" ? <div className="billing-message">We could not start the order. Please try again.</div> : null}{userId ? <form action="/api/billing/checkout" method="post"><input type="hidden" name="returnTo" value="/experiments/electrical-power-energy" /><button className="pack-checkout-button" type="submit" disabled={!isSupabaseAdminConfigured()}><CreditCard size={16} />Unlock the pack</button></form> : <Link className="pack-checkout-button" href="/login?next=%2Fexperiments%2Felectrical-power-energy"><UserRound size={16} />Sign in to unlock</Link>}<small><ShieldCheck size={13} />One-time payment by Waffo Pancake. <Link href="/refund-policy">Refund policy</Link></small></div>
      </section>
      <figure className="pack-preview"><Image src={previewImage.url} alt={previewImage.alt} width={previewImage.width} height={previewImage.height} priority /><figcaption><span>Actual experiment output</span><strong>Compare power as a transfer rate and energy as an amount accumulated over time.</strong></figcaption></figure>
    </div>
  </main>;
}
