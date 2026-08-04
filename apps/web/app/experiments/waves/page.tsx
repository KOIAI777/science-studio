import type {Metadata} from "next";
import {ArrowLeft, BookOpenCheck, CreditCard, FlaskConical, Gauge, LockKeyhole, MonitorPlay, ShieldCheck, SlidersHorizontal, UserRound, Waves} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {ExperimentStructuredData} from "../../../components/experiment-structured-data";
import {PrimarySiteNavigation} from "../../../components/primary-site-navigation";
import {TravelingWaveWorkbench} from "../../../components/traveling-wave-workbench";
import {isSupabaseAdminConfigured} from "../../../lib/supabase/admin";
import {isLocalPaidExperimentPreviewEnabled, isSupabaseConfigured} from "../../../lib/supabase/config";
import {createClient} from "../../../lib/supabase/server";
import {MIDDLE_SCHOOL_PACK_PRICE_USD, MIDDLE_SCHOOL_PACK_SKU} from "../../../lib/waffo";

const pageTitle = "Waves: Frequency, Wavelength & Speed";
const socialTitle = `${pageTitle} | Science Studio`;
const description = "Measure amplitude, period, frequency, wavelength, and wave speed on a traveling transverse wave, then compare two frequencies in the same medium.";
const previewImage = {
  url: "/experiments/waves-classroom-diagram.png",
  width: 1476,
  height: 808,
  alt: "Science Studio traveling-wave experiment comparing two frequencies at the same wave speed",
};

export const metadata: Metadata = {
  title: pageTitle,
  description,
  robots: {index: true, follow: true},
  alternates: {canonical: "/experiments/waves"},
  openGraph: {type: "website", title: socialTitle, description, url: "/experiments/waves", images: [previewImage]},
  twitter: {card: "summary_large_image", title: socialTitle, description, images: [previewImage.url]},
};

interface WavesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function WavesExperimentPage({searchParams}: WavesPageProps) {
  const params = await searchParams;
  const forceOfferPreview = process.env.NODE_ENV === "development" && first(params.preview) === "offer";
  if (isLocalPaidExperimentPreviewEnabled() && !forceOfferPreview) return <TravelingWaveWorkbench />;

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

  if (hasAccess) return <TravelingWaveWorkbench />;

  const billingMessage = first(params.billing);
  return <main className="pack-access-page">
    <ExperimentStructuredData name={pageTitle} description={description} path="/experiments/waves" image={previewImage.url} teaches={["Transverse waves", "Amplitude", "Frequency and period", "Wavelength", "Wave speed"]} lessonMinutes={12} isFree={false} price={MIDDLE_SCHOOL_PACK_PRICE_USD} />
    <header className="site-header"><div className="site-header-inner"><Link className="site-brand" href="/" aria-label="Science Studio by ClassroomLab home"><span className="brand-mark"><FlaskConical size={17} /></span><span className="brand-copy"><strong>Science Studio</strong><small>by ClassroomLab</small></span></Link><PrimarySiteNavigation active="experiments" /><div className="site-actions"><Link className="header-account-link" href="/account"><UserRound size={15} /><span>Account</span></Link></div></div></header>
    <div className="pack-access-main">
      <div className="library-breadcrumb"><Link href="/experiments"><ArrowLeft size={14} />Experiment library</Link><span>/</span><span>Waves</span></div>
      <section className="pack-access-layout">
        <div className="pack-access-copy"><span className="section-kicker"><LockKeyhole size={14} />Middle School Physics Foundations</span><h1>Waves: Frequency, Wavelength &amp; Speed</h1><p className="pack-access-lede">Show what travels and what only oscillates. Measure one complete wave, verify <em>v = fλ</em>, and compare two frequencies without changing the medium.</p><ul className="pack-access-list"><li><Waves size={15} />Animated transverse-wave and particle motion</li><li><Gauge size={15} />Live amplitude, period, wavelength, and speed measurements</li><li><SlidersHorizontal size={15} />A/B comparison at a fixed wave speed</li><li><BookOpenCheck size={15} />Six editable explanation steps for a 12-minute lesson</li><li><MonitorPlay size={15} />16:9 and 9:16 canvases with zoom and fullscreen</li></ul></div>
        <div className="pack-access-card"><div className="pack-price"><strong>${MIDDLE_SCHOOL_PACK_PRICE_USD}</strong><span>one-time early access</span></div><p>Unlock all ten released experiments in Middle School Physics Foundations, plus every classroom-ready experiment added to the pack.</p>{billingMessage === "configuration" ? <div className="billing-message">Billing is not configured on this server yet.</div> : billingMessage === "checkout" ? <div className="billing-message">Checkout could not be created. Please try again.</div> : billingMessage === "order" ? <div className="billing-message">We could not start the order. Please try again.</div> : null}{userId ? <form action="/api/billing/checkout" method="post"><input type="hidden" name="returnTo" value="/experiments/waves" /><button className="pack-checkout-button" type="submit" disabled={!isSupabaseAdminConfigured()}><CreditCard size={16} />Unlock the pack</button></form> : <Link className="pack-checkout-button" href="/login?next=%2Fexperiments%2Fwaves"><UserRound size={16} />Sign in to unlock</Link>}<small><ShieldCheck size={13} />One-time payment by Waffo Pancake. <Link href="/refund-policy">Refund policy</Link></small></div>
      </section>
      <figure className="pack-preview"><Image src={previewImage.url} alt={previewImage.alt} width={previewImage.width} height={previewImage.height} priority /><figcaption><span>Actual experiment output</span><strong>Two synchronized waves make frequency and wavelength visible at a glance.</strong></figcaption></figure>
    </div>
  </main>;
}
