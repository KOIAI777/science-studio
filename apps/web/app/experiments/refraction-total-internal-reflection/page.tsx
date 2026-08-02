import type {Metadata} from "next";
import {Activity, ArrowLeft, BookOpenCheck, CreditCard, FlaskConical, Gauge, LockKeyhole, MonitorPlay, Ruler, ShieldCheck, SlidersHorizontal, UserRound} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {ExperimentStructuredData} from "../../../components/experiment-structured-data";
import {RayOpticsWorkbench} from "../../../components/ray-optics-workbench";
import {isSupabaseAdminConfigured} from "../../../lib/supabase/admin";
import {isLocalPaidExperimentPreviewEnabled, isSupabaseConfigured} from "../../../lib/supabase/config";
import {createClient} from "../../../lib/supabase/server";
import {MIDDLE_SCHOOL_PACK_PRICE_USD, MIDDLE_SCHOOL_PACK_SKU} from "../../../lib/waffo";

const pageTitle = "Refraction & Total Internal Reflection Lab";
const socialTitle = `${pageTitle} | Science Studio`;
const description = "Construct accurate reflection and refraction ray diagrams, apply Snell's law, and test the critical-angle condition for total internal reflection.";
const previewImage = {
  url: "/experiments/refraction-total-internal-reflection-classroom-diagram.png",
  width: 1200,
  height: 620,
  alt: "Science Studio refraction and total internal reflection experiment showing incident, reflected, and refracted rays at a flat boundary",
};

export const metadata: Metadata = {
  title: pageTitle,
  description,
  robots: {index: true, follow: true},
  alternates: {canonical: "/experiments/refraction-total-internal-reflection"},
  openGraph: {type: "website", title: socialTitle, description, url: "/experiments/refraction-total-internal-reflection", images: [previewImage]},
  twitter: {card: "summary_large_image", title: socialTitle, description, images: [previewImage.url]},
};

interface RefractionPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function RefractionExperimentPage({searchParams}: RefractionPageProps) {
  const params = await searchParams;
  const forceOfferPreview = process.env.NODE_ENV === "development" && first(params.preview) === "offer";
  if (isLocalPaidExperimentPreviewEnabled() && !forceOfferPreview) return <RayOpticsWorkbench />;

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

  if (hasAccess) return <RayOpticsWorkbench />;

  const billingMessage = first(params.billing);
  return <main className="pack-access-page">
    <ExperimentStructuredData name={pageTitle} description={description} path="/experiments/refraction-total-internal-reflection" image={previewImage.url} teaches={["Law of reflection", "Snell's law", "Refractive index", "Critical angle", "Total internal reflection"]} lessonMinutes={15} isFree={false} price={MIDDLE_SCHOOL_PACK_PRICE_USD} />
    <header className="site-header"><div className="site-header-inner"><Link className="site-brand" href="/" aria-label="Science Studio home"><span className="brand-mark"><FlaskConical size={17} /></span><strong>Science Studio</strong></Link><nav className="site-nav" aria-label="Primary navigation"><Link className="active" href="/experiments">Experiment library</Link><Link href="/#pricing">Pricing</Link></nav><div className="site-actions"><Link className="header-account-link" href="/account"><UserRound size={15} /><span>Account</span></Link></div></div></header>
    <div className="pack-access-main">
      <div className="library-breadcrumb"><Link href="/experiments"><ArrowLeft size={14} />Experiment library</Link><span>/</span><span>Refraction &amp; Total Internal Reflection</span></div>
      <section className="pack-access-layout">
        <div className="pack-access-copy"><span className="section-kicker"><LockKeyhole size={14} />Middle School Physics Foundations</span><h1>Refraction &amp; Total Internal Reflection</h1><p className="pack-access-lede">Change the two media and the incident angle, then construct the reflected and transmitted rays from one point of incidence.</p><ul className="pack-access-list"><li><Ruler size={15} />Angles measured correctly from the normal</li><li><Activity size={15} />Live reflection, Snell's law, and critical-angle calculations</li><li><Gauge size={15} />Air-to-glass, water-to-air, and glass-to-air presets</li><li><SlidersHorizontal size={15} />Independent refractive-index and incident-angle controls</li><li><BookOpenCheck size={15} />Six editable explanation steps for a 15-minute lesson</li><li><MonitorPlay size={15} />16:9 and 9:16 canvases with zoom and fullscreen</li></ul></div>
        <div className="pack-access-card"><div className="pack-price"><strong>${MIDDLE_SCHOOL_PACK_PRICE_USD}</strong><span>one-time early access</span></div><p>Unlock all eight released experiments in Middle School Physics Foundations, plus every classroom-ready experiment added to this pack.</p>{billingMessage === "configuration" ? <div className="billing-message">Billing is not configured on this server yet.</div> : billingMessage === "checkout" ? <div className="billing-message">Checkout could not be created. Please try again.</div> : billingMessage === "order" ? <div className="billing-message">We could not start the order. Please try again.</div> : null}{userId ? <form action="/api/billing/checkout" method="post"><input type="hidden" name="returnTo" value="/experiments/refraction-total-internal-reflection" /><button className="pack-checkout-button" type="submit" disabled={!isSupabaseAdminConfigured()}><CreditCard size={16} />Unlock the pack</button></form> : <Link className="pack-checkout-button" href="/login?next=%2Fexperiments%2Frefraction-total-internal-reflection"><UserRound size={16} />Sign in to unlock</Link>}<small><ShieldCheck size={13} />No subscription. Refunds are handled by Waffo.</small></div>
      </section>
      <figure className="pack-preview"><Image src={previewImage.url} alt={previewImage.alt} width={previewImage.width} height={previewImage.height} priority /><figcaption><span>Actual experiment output</span><strong>Keep the interface, normal, three rays, and governing equations visible in one classroom diagram.</strong></figcaption></figure>
    </div>
  </main>;
}
