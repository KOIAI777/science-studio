import type {Metadata} from "next";
import {Aperture, ArrowLeft, BookOpenCheck, CreditCard, Eye, FlaskConical, LockKeyhole, MonitorPlay, Ruler, ShieldCheck, SlidersHorizontal, UserRound} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {ExperimentStructuredData} from "../../../components/experiment-structured-data";
import {ThinLensWorkbench} from "../../../components/thin-lens-workbench";
import {isSupabaseAdminConfigured} from "../../../lib/supabase/admin";
import {isLocalPaidExperimentPreviewEnabled, isSupabaseConfigured} from "../../../lib/supabase/config";
import {createClient} from "../../../lib/supabase/server";
import {MIDDLE_SCHOOL_PACK_PRICE_USD, MIDDLE_SCHOOL_PACK_SKU} from "../../../lib/waffo";

const pageTitle = "Lenses & Image Formation";
const socialTitle = `${pageTitle} | Science Studio`;
const description = "Construct three principal rays, calculate image distance and magnification, and compare real and virtual images formed by converging and diverging lenses.";
const previewImage = {
  url: "/experiments/lenses-image-formation-classroom-diagram.png",
  width: 1280,
  height: 720,
  alt: "Science Studio optical bench showing a converging lens, F and 2F markers, object and image arrows, and three principal rays",
};

export const metadata: Metadata = {
  title: pageTitle,
  description,
  robots: {index: true, follow: true},
  alternates: {canonical: "/experiments/lenses-image-formation"},
  openGraph: {type: "website", title: socialTitle, description, url: "/experiments/lenses-image-formation", images: [previewImage]},
  twitter: {card: "summary_large_image", title: socialTitle, description, images: [previewImage.url]},
};

interface LensesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LensesImageFormationPage({searchParams}: LensesPageProps) {
  const params = await searchParams;
  const forceOfferPreview = process.env.NODE_ENV === "development" && first(params.preview) === "offer";
  if (isLocalPaidExperimentPreviewEnabled() && !forceOfferPreview) return <ThinLensWorkbench />;

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

  if (hasAccess) return <ThinLensWorkbench />;

  const billingMessage = first(params.billing);
  return <main className="pack-access-page">
    <ExperimentStructuredData name={pageTitle} description={description} path="/experiments/lenses-image-formation" image={previewImage.url} teaches={["Thin lenses", "Principal rays", "Focal length", "Real and virtual images", "Magnification"]} lessonMinutes={15} isFree={false} price={MIDDLE_SCHOOL_PACK_PRICE_USD} />
    <header className="site-header"><div className="site-header-inner"><Link className="site-brand" href="/" aria-label="Science Studio home"><span className="brand-mark"><FlaskConical size={17} /></span><strong>Science Studio</strong></Link><nav className="site-nav" aria-label="Primary navigation"><Link className="active" href="/experiments">Experiment library</Link><Link href="/#pricing">Pricing</Link></nav><div className="site-actions"><Link className="header-account-link" href="/account"><UserRound size={15} /><span>Account</span></Link></div></div></header>
    <div className="pack-access-main">
      <div className="library-breadcrumb"><Link href="/experiments"><ArrowLeft size={14} />Experiment library</Link><span>/</span><span>Lenses &amp; Image Formation</span></div>
      <section className="pack-access-layout">
        <div className="pack-access-copy"><span className="section-kicker"><LockKeyhole size={14} />Middle School Physics Foundations</span><h1>Lenses &amp; Image Formation</h1><p className="pack-access-lede">Turn ray diagrams into a repeatable method. Move the object across F and 2F, construct the image, and verify every result with the thin-lens equation.</p><ul className="pack-access-list"><li><Aperture size={15} />Converging and diverging thin-lens models</li><li><Ruler size={15} />One proportional optical bench with F and 2F markers</li><li><Eye size={15} />Three solver-linked principal rays and virtual extensions</li><li><SlidersHorizontal size={15} />Beyond 2F, at 2F, inside F, and diverging presets</li><li><BookOpenCheck size={15} />Six editable explanation steps for a 15-minute lesson</li><li><MonitorPlay size={15} />16:9 and 9:16 canvases with zoom and fullscreen</li></ul></div>
        <div className="pack-access-card"><div className="pack-price"><strong>${MIDDLE_SCHOOL_PACK_PRICE_USD}</strong><span>one-time early access</span></div><p>Unlock all ten released experiments in Middle School Physics Foundations, plus every classroom-ready experiment added to this pack.</p>{billingMessage === "configuration" ? <div className="billing-message">Billing is not configured on this server yet.</div> : billingMessage === "checkout" ? <div className="billing-message">Checkout could not be created. Please try again.</div> : billingMessage === "order" ? <div className="billing-message">We could not start the order. Please try again.</div> : null}{userId ? <form action="/api/billing/checkout" method="post"><input type="hidden" name="returnTo" value="/experiments/lenses-image-formation" /><button className="pack-checkout-button" type="submit" disabled={!isSupabaseAdminConfigured()}><CreditCard size={16} />Unlock the pack</button></form> : <Link className="pack-checkout-button" href="/login?next=%2Fexperiments%2Flenses-image-formation"><UserRound size={16} />Sign in to unlock</Link>}<small><ShieldCheck size={13} />One-time payment by Waffo Pancake. <Link href="/refund-policy">Refund policy</Link></small></div>
      </section>
      <figure className="pack-preview"><Image src={previewImage.url} alt={previewImage.alt} width={previewImage.width} height={previewImage.height} priority /><figcaption><span>Actual experiment output</span><strong>See the three principal rays locate the image, then confirm its position, orientation, and scale numerically.</strong></figcaption></figure>
    </div>
  </main>;
}
