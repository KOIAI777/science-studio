import type {Metadata} from "next";
import {ArrowLeft, BookOpenCheck, CreditCard, FlaskConical, Gauge, LockKeyhole, Mic2, MonitorPlay, ShieldCheck, SlidersHorizontal, UserRound, Waves} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {ExperimentStructuredData} from "../../../components/experiment-structured-data";
import {SoundWaveWorkbench} from "../../../components/sound-wave-workbench";
import {isSupabaseAdminConfigured} from "../../../lib/supabase/admin";
import {isLocalPaidExperimentPreviewEnabled, isSupabaseConfigured} from "../../../lib/supabase/config";
import {createClient} from "../../../lib/supabase/server";
import {MIDDLE_SCHOOL_PACK_PRICE_USD, MIDDLE_SCHOOL_PACK_SKU} from "../../../lib/waffo";

const pageTitle = "Sound: Pitch, Loudness & Speed";
const socialTitle = `${pageTitle} | Science Studio`;
const description = "Visualize a longitudinal sound wave, connect frequency and sound level to pitch and loudness, and measure propagation speed with two microphones.";
const previewImage = {
  url: "/experiments/sound-waves-classroom-diagram.png",
  width: 1280,
  height: 720,
  alt: "Science Studio sound-wave experiment showing a loudspeaker, longitudinal particle motion, two microphones, and synchronized pressure traces",
};

export const metadata: Metadata = {
  title: pageTitle,
  description,
  robots: {index: true, follow: true},
  alternates: {canonical: "/experiments/sound-waves"},
  openGraph: {type: "website", title: socialTitle, description, url: "/experiments/sound-waves", images: [previewImage]},
  twitter: {card: "summary_large_image", title: socialTitle, description, images: [previewImage.url]},
};

interface SoundWavesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SoundWavesExperimentPage({searchParams}: SoundWavesPageProps) {
  const params = await searchParams;
  const forceOfferPreview = process.env.NODE_ENV === "development" && first(params.preview) === "offer";
  if (isLocalPaidExperimentPreviewEnabled() && !forceOfferPreview) return <SoundWaveWorkbench />;

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

  if (hasAccess) return <SoundWaveWorkbench />;

  const billingMessage = first(params.billing);
  return <main className="pack-access-page">
    <ExperimentStructuredData name={pageTitle} description={description} path="/experiments/sound-waves" image={previewImage.url} teaches={["Longitudinal sound waves", "Pitch and frequency", "Sound pressure level", "Speed of sound", "Microphone time delay"]} lessonMinutes={15} isFree={false} price={MIDDLE_SCHOOL_PACK_PRICE_USD} />
    <header className="site-header"><div className="site-header-inner"><Link className="site-brand" href="/" aria-label="Science Studio home"><span className="brand-mark"><FlaskConical size={17} /></span><strong>Science Studio</strong></Link><nav className="site-nav" aria-label="Primary navigation"><Link className="active" href="/experiments">Experiment library</Link><Link href="/#pricing">Pricing</Link></nav><div className="site-actions"><Link className="header-account-link" href="/account"><UserRound size={15} /><span>Account</span></Link></div></div></header>
    <div className="pack-access-main">
      <div className="library-breadcrumb"><Link href="/experiments"><ArrowLeft size={14} />Experiment library</Link><span>/</span><span>Sound waves</span></div>
      <section className="pack-access-layout">
        <div className="pack-access-copy"><span className="section-kicker"><LockKeyhole size={14} />Middle School Physics Foundations</span><h1>Sound: Pitch, Loudness &amp; Speed</h1><p className="pack-access-lede">Make an invisible longitudinal wave measurable. Follow particle motion, compare media, and use two microphones to calculate sound speed from a real arrival delay.</p><ul className="pack-access-list"><li><Waves size={15} />Solver-linked compressions, rarefactions, and wavefront</li><li><Mic2 size={15} />Two synchronized microphone pressure traces</li><li><Gauge size={15} />Live pitch, pressure, wavelength, speed, and delay readings</li><li><SlidersHorizontal size={15} />Air, water, and steel reference-medium presets</li><li><BookOpenCheck size={15} />Six editable explanation steps for a 15-minute lesson</li><li><MonitorPlay size={15} />16:9 and 9:16 canvases with zoom and fullscreen</li></ul></div>
        <div className="pack-access-card"><div className="pack-price"><strong>${MIDDLE_SCHOOL_PACK_PRICE_USD}</strong><span>one-time early access</span></div><p>Unlock all ten released experiments in Middle School Physics Foundations, plus every classroom-ready experiment added to this pack.</p>{billingMessage === "configuration" ? <div className="billing-message">Billing is not configured on this server yet.</div> : billingMessage === "checkout" ? <div className="billing-message">Checkout could not be created. Please try again.</div> : billingMessage === "order" ? <div className="billing-message">We could not start the order. Please try again.</div> : null}{userId ? <form action="/api/billing/checkout" method="post"><input type="hidden" name="returnTo" value="/experiments/sound-waves" /><button className="pack-checkout-button" type="submit" disabled={!isSupabaseAdminConfigured()}><CreditCard size={16} />Unlock the pack</button></form> : <Link className="pack-checkout-button" href="/login?next=%2Fexperiments%2Fsound-waves"><UserRound size={16} />Sign in to unlock</Link>}<small><ShieldCheck size={13} />One-time payment by Waffo Pancake. <Link href="/refund-policy">Refund policy</Link></small></div>
      </section>
      <figure className="pack-preview"><Image src={previewImage.url} alt={previewImage.alt} width={previewImage.width} height={previewImage.height} priority /><figcaption><span>Actual experiment output</span><strong>See what the particles do, what the sound carries, and how the same signal reaches two microphones at different times.</strong></figcaption></figure>
    </div>
  </main>;
}
