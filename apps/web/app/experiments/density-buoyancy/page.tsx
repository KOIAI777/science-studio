import type {Metadata} from "next";
import {
  ArrowLeft,
  BookOpenCheck,
  CreditCard,
  Droplets,
  FlaskConical,
  Gauge,
  LockKeyhole,
  MonitorPlay,
  Scale,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {BuoyancyWorkbench} from "../../../components/buoyancy-workbench";
import {ExperimentStructuredData} from "../../../components/experiment-structured-data";
import {PrimarySiteNavigation} from "../../../components/primary-site-navigation";
import {isSupabaseAdminConfigured} from "../../../lib/supabase/admin";
import {isLocalPaidExperimentPreviewEnabled, isSupabaseConfigured} from "../../../lib/supabase/config";
import {createClient} from "../../../lib/supabase/server";
import {MIDDLE_SCHOOL_PACK_PRICE_USD, MIDDLE_SCHOOL_PACK_SKU} from "../../../lib/waffo";

const pageTitle = "Density & Buoyancy: Float, Sink or Suspend";
const socialTitle = `${pageTitle} | Science Studio`;
const description = "Compare the same object in two fluids, track displaced volume and forces, and use Archimedes' principle to explain floating, suspension, and sinking.";
const previewImage = {
  url: "/experiments/density-buoyancy-classroom-diagram.png",
  width: 1200,
  height: 676,
  alt: "Science Studio density and buoyancy experiment comparing the same object in water and oil",
};

export const metadata: Metadata = {
  title: pageTitle,
  description,
  robots: {index: true, follow: true},
  alternates: {canonical: "/experiments/density-buoyancy"},
  openGraph: {type: "website", title: socialTitle, description, url: "/experiments/density-buoyancy", images: [previewImage]},
  twitter: {card: "summary_large_image", title: socialTitle, description, images: [previewImage.url]},
};

interface DensityBuoyancyPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DensityBuoyancyExperimentPage({searchParams}: DensityBuoyancyPageProps) {
  const params = await searchParams;
  const forceOfferPreview = process.env.NODE_ENV === "development" && first(params.preview) === "offer";
  if (isLocalPaidExperimentPreviewEnabled() && !forceOfferPreview) return <BuoyancyWorkbench />;

  let userId: string | undefined;
  let hasAccess = false;
  if (isSupabaseConfigured() && !forceOfferPreview) {
    const supabase = await createClient();
    const {data: claimsData} = await supabase.auth.getClaims();
    userId = claimsData?.claims?.sub;
    if (userId) {
      const {data: entitlement} = await supabase
        .from("entitlements")
        .select("status")
        .eq("user_id", userId)
        .eq("sku", MIDDLE_SCHOOL_PACK_SKU)
        .eq("status", "active")
        .maybeSingle();
      hasAccess = entitlement?.status === "active";
    }
  }

  if (hasAccess) return <BuoyancyWorkbench />;

  const billingMessage = first(params.billing);
  return (
    <main className="pack-access-page">
      <ExperimentStructuredData
        name={pageTitle}
        description={description}
        path="/experiments/density-buoyancy"
        image={previewImage.url}
        teaches={["Density", "Buoyant force", "Displaced volume", "Archimedes' principle", "Floating equilibrium"]}
        lessonMinutes={15}
        isFree={false}
        price={MIDDLE_SCHOOL_PACK_PRICE_USD}
      />
      <header className="site-header">
        <div className="site-header-inner">
          <Link className="site-brand" href="/" aria-label="Science Studio home"><span className="brand-mark"><FlaskConical size={17} /></span><strong>Science Studio</strong></Link>
          <PrimarySiteNavigation active="experiments" />
          <div className="site-actions"><Link className="header-account-link" href="/account"><UserRound size={15} /><span>Account</span></Link></div>
        </div>
      </header>
      <div className="pack-access-main">
        <div className="library-breadcrumb"><Link href="/experiments"><ArrowLeft size={14} />Experiment library</Link><span>/</span><span>Density &amp; Buoyancy</span></div>
        <section className="pack-access-layout">
          <div className="pack-access-copy">
            <span className="section-kicker"><LockKeyhole size={14} />Middle School Physics Foundations</span>
            <h1>Density &amp; Buoyancy: Float, Sink or Suspend</h1>
            <p className="pack-access-lede">Release the same cube in two fluids. Compare density, displaced volume, and vertical forces while one object rises and the other sinks.</p>
            <ul className="pack-access-list">
              <li><Droplets size={15} />Side-by-side oil, water, and salt-water comparisons</li>
              <li><Scale size={15} />Correct weight, buoyancy, drag, and bottom normal forces</li>
              <li><Gauge size={15} />Live displaced volume, submerged fraction, and net force</li>
              <li><SlidersHorizontal size={15} />Object mass, volume, fluid density, and gravity controls</li>
              <li><BookOpenCheck size={15} />Six editable explanation steps for a 15-minute lesson</li>
              <li><MonitorPlay size={15} />16:9 and 9:16 canvases with zoom and fullscreen</li>
            </ul>
          </div>
          <div className="pack-access-card">
            <div className="pack-price"><strong>${MIDDLE_SCHOOL_PACK_PRICE_USD}</strong><span>one-time early access</span></div>
            <p>Unlock all ten released experiments in Middle School Physics Foundations, plus every classroom-ready experiment added to this pack.</p>
            {billingMessage === "configuration" ? <div className="billing-message">Billing is not configured on this server yet.</div> : billingMessage === "checkout" ? <div className="billing-message">Checkout could not be created. Please try again.</div> : billingMessage === "order" ? <div className="billing-message">We could not start the order. Please try again.</div> : null}
            {userId ? <form action="/api/billing/checkout" method="post"><input type="hidden" name="returnTo" value="/experiments/density-buoyancy" /><button className="pack-checkout-button" type="submit" disabled={!isSupabaseAdminConfigured()}><CreditCard size={16} />Unlock the pack</button></form> : <Link className="pack-checkout-button" href="/login?next=%2Fexperiments%2Fdensity-buoyancy"><UserRound size={16} />Sign in to unlock</Link>}
            <small><ShieldCheck size={13} />One-time payment by Waffo Pancake. <Link href="/refund-policy">Refund policy</Link></small>
          </div>
        </section>
        <figure className="pack-preview">
          <Image src={previewImage.url} alt={previewImage.alt} width={previewImage.width} height={previewImage.height} priority />
          <figcaption><span>Actual experiment output</span><strong>The same object produces two different outcomes because the fluids have different densities.</strong></figcaption>
        </figure>
      </div>
    </main>
  );
}
