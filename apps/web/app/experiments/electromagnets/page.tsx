import type {Metadata} from "next";
import {ArrowLeft, BookOpenCheck, Compass, CreditCard, FlaskConical, Gauge, LockKeyhole, Magnet, MonitorPlay, ShieldCheck, SlidersHorizontal, UserRound, Zap} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {ElectromagnetWorkbench} from "../../../components/electromagnet-workbench";
import {ExperimentStructuredData} from "../../../components/experiment-structured-data";
import {isSupabaseAdminConfigured} from "../../../lib/supabase/admin";
import {isLocalPaidExperimentPreviewEnabled, isSupabaseConfigured} from "../../../lib/supabase/config";
import {createClient} from "../../../lib/supabase/server";
import {MIDDLE_SCHOOL_PACK_PRICE_USD, MIDDLE_SCHOOL_PACK_SKU} from "../../../lib/waffo";

const pageTitle = "Electromagnets: Current, Coils & Polarity";
const socialTitle = `${pageTitle} | Science Studio`;
const description = "Change current, coil turns, core material, and direction to calculate magnetic field strength, identify polarity, and read a compass probe.";
const previewImage = {
  url: "/experiments/electromagnets-classroom-diagram.png",
  width: 1280,
  height: 720,
  alt: "Science Studio electromagnet experiment showing a current-carrying coil, magnetic field lines, labeled poles, and a compass probe",
};

export const metadata: Metadata = {
  title: pageTitle,
  description,
  robots: {index: true, follow: true},
  alternates: {canonical: "/experiments/electromagnets"},
  openGraph: {type: "website", title: socialTitle, description, url: "/experiments/electromagnets", images: [previewImage]},
  twitter: {card: "summary_large_image", title: socialTitle, description, images: [previewImage.url]},
};

interface ElectromagnetsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ElectromagnetsExperimentPage({searchParams}: ElectromagnetsPageProps) {
  const params = await searchParams;
  const forceOfferPreview = process.env.NODE_ENV === "development" && first(params.preview) === "offer";
  if (isLocalPaidExperimentPreviewEnabled() && !forceOfferPreview) return <ElectromagnetWorkbench />;

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

  if (hasAccess) return <ElectromagnetWorkbench />;

  const billingMessage = first(params.billing);
  return <main className="pack-access-page">
    <ExperimentStructuredData name={pageTitle} description={description} path="/experiments/electromagnets" image={previewImage.url} teaches={["Electromagnets", "Magnetic field strength", "Solenoid polarity", "Right-hand grip rule", "Compass deflection"]} lessonMinutes={15} isFree={false} price={MIDDLE_SCHOOL_PACK_PRICE_USD} />
    <header className="site-header"><div className="site-header-inner"><Link className="site-brand" href="/" aria-label="Science Studio home"><span className="brand-mark"><FlaskConical size={17} /></span><strong>Science Studio</strong></Link><nav className="site-nav" aria-label="Primary navigation"><Link className="active" href="/experiments">Experiment library</Link><Link href="/#pricing">Pricing</Link></nav><div className="site-actions"><Link className="header-account-link" href="/account"><UserRound size={15} /><span>Account</span></Link></div></div></header>
    <div className="pack-access-main">
      <div className="library-breadcrumb"><Link href="/experiments"><ArrowLeft size={14} />Experiment library</Link><span>/</span><span>Electromagnets</span></div>
      <section className="pack-access-layout">
        <div className="pack-access-copy"><span className="section-kicker"><LockKeyhole size={14} />Middle School Physics Foundations</span><h1>Electromagnets: Current, Coils &amp; Polarity</h1><p className="pack-access-lede">Make the invisible field explainable. Change one variable at a time, identify the poles with the right-hand rule, and verify the external field with a compass probe.</p><ul className="pack-access-list"><li><Magnet size={15} />Solver-linked field lines and N/S polarity</li><li><Zap size={15} />Visible conventional-current direction around the winding</li><li><Compass size={15} />Distance-aware compass probe and deflection reading</li><li><Gauge size={15} />Center field, probe field, ampere-turns, and turn density</li><li><SlidersHorizontal size={15} />Air core, linear iron core, more-turns, and reverse presets</li><li><BookOpenCheck size={15} />Six editable explanation steps for a 15-minute lesson</li><li><MonitorPlay size={15} />16:9 and 9:16 canvases with zoom and fullscreen</li></ul></div>
        <div className="pack-access-card"><div className="pack-price"><strong>${MIDDLE_SCHOOL_PACK_PRICE_USD}</strong><span>one-time early access</span></div><p>Unlock all ten released experiments in Middle School Physics Foundations, plus every classroom-ready experiment added to this pack.</p>{billingMessage === "configuration" ? <div className="billing-message">Billing is not configured on this server yet.</div> : billingMessage === "checkout" ? <div className="billing-message">Checkout could not be created. Please try again.</div> : billingMessage === "order" ? <div className="billing-message">We could not start the order. Please try again.</div> : null}{userId ? <form action="/api/billing/checkout" method="post"><input type="hidden" name="returnTo" value="/experiments/electromagnets" /><button className="pack-checkout-button" type="submit" disabled={!isSupabaseAdminConfigured()}><CreditCard size={16} />Unlock the pack</button></form> : <Link className="pack-checkout-button" href="/login?next=%2Fexperiments%2Felectromagnets"><UserRound size={16} />Sign in to unlock</Link>}<small><ShieldCheck size={13} />No subscription. Refunds are handled by Waffo.</small></div>
      </section>
      <figure className="pack-preview"><Image src={previewImage.url} alt={previewImage.alt} width={previewImage.width} height={previewImage.height} priority /><figcaption><span>Actual experiment output</span><strong>See how current and winding geometry set the field, then reverse the poles and test the result with a compass.</strong></figcaption></figure>
    </div>
  </main>;
}
