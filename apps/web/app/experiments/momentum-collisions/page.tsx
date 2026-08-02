import type {Metadata} from "next";
import {Activity, ArrowLeft, ArrowLeftRight, BookOpenCheck, CreditCard, FlaskConical, Gauge, LockKeyhole, MonitorPlay, Scale, ShieldCheck, SlidersHorizontal, UserRound} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {ExperimentStructuredData} from "../../../components/experiment-structured-data";
import {MomentumCollisionWorkbench} from "../../../components/momentum-collision-workbench";
import {isSupabaseAdminConfigured} from "../../../lib/supabase/admin";
import {isLocalPaidExperimentPreviewEnabled, isSupabaseConfigured} from "../../../lib/supabase/config";
import {createClient} from "../../../lib/supabase/server";
import {MIDDLE_SCHOOL_PACK_PRICE_USD, MIDDLE_SCHOOL_PACK_SKU} from "../../../lib/waffo";

const pageTitle = "Momentum & Collisions: Elastic or Inelastic?";
const socialTitle = `${pageTitle} | Science Studio`;
const description = "Compare elastic, partially inelastic, and perfectly inelastic cart collisions using momentum, impulse, final velocity, and kinetic energy.";
const previewImage = {
  url: "/experiments/momentum-collisions-classroom-diagram.png",
  width: 734,
  height: 482,
  alt: "Science Studio momentum and collisions experiment showing two carts and before-after momentum measurements",
};

export const metadata: Metadata = {
  title: pageTitle,
  description,
  robots: {index: true, follow: true},
  alternates: {canonical: "/experiments/momentum-collisions"},
  openGraph: {type: "website", title: socialTitle, description, url: "/experiments/momentum-collisions", images: [previewImage]},
  twitter: {card: "summary_large_image", title: socialTitle, description, images: [previewImage.url]},
};

interface MomentumCollisionsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MomentumCollisionsExperimentPage({searchParams}: MomentumCollisionsPageProps) {
  const params = await searchParams;
  const forceOfferPreview = process.env.NODE_ENV === "development" && first(params.preview) === "offer";
  if (isLocalPaidExperimentPreviewEnabled() && !forceOfferPreview) return <MomentumCollisionWorkbench />;

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

  if (hasAccess) return <MomentumCollisionWorkbench />;

  const billingMessage = first(params.billing);
  return <main className="pack-access-page">
    <ExperimentStructuredData name={pageTitle} description={description} path="/experiments/momentum-collisions" image={previewImage.url} teaches={["Momentum conservation", "Impulse", "Elastic and inelastic collisions", "Coefficient of restitution", "Kinetic-energy change"]} lessonMinutes={15} isFree={false} price={MIDDLE_SCHOOL_PACK_PRICE_USD} />
    <header className="site-header"><div className="site-header-inner"><Link className="site-brand" href="/" aria-label="Science Studio home"><span className="brand-mark"><FlaskConical size={17} /></span><strong>Science Studio</strong></Link><nav className="site-nav" aria-label="Primary navigation"><Link className="active" href="/experiments">Experiment library</Link><Link href="/#pricing">Pricing</Link></nav><div className="site-actions"><Link className="header-account-link" href="/account"><UserRound size={15} /><span>Account</span></Link></div></div></header>
    <div className="pack-access-main">
      <div className="library-breadcrumb"><Link href="/experiments"><ArrowLeft size={14} />Experiment library</Link><span>/</span><span>Momentum &amp; Collisions</span></div>
      <section className="pack-access-layout">
        <div className="pack-access-copy"><span className="section-kicker"><LockKeyhole size={14} />Middle School Physics Foundations</span><h1>Momentum &amp; Collisions: Elastic or Inelastic?</h1><p className="pack-access-lede">Send two carts toward impact, predict their final velocities, and compare what is conserved across three collision types.</p><ul className="pack-access-list"><li><ArrowLeftRight size={15} />Two-cart motion with signed velocity vectors</li><li><Scale size={15} />Before-and-after momentum ledger for each cart and the system</li><li><Activity size={15} />Correct impulse and kinetic-energy change for every collision</li><li><Gauge size={15} />Elastic, partially inelastic, and stick-together presets</li><li><SlidersHorizontal size={15} />Independent mass, initial velocity, and restitution controls</li><li><BookOpenCheck size={15} />Six editable explanation steps for a 15-minute lesson</li><li><MonitorPlay size={15} />16:9 and 9:16 canvases with zoom and fullscreen</li></ul></div>
        <div className="pack-access-card"><div className="pack-price"><strong>${MIDDLE_SCHOOL_PACK_PRICE_USD}</strong><span>one-time early access</span></div><p>Unlock the full Middle School Physics Foundations pack, including ten released experiments and every classroom-ready experiment added to this pack.</p>{billingMessage === "configuration" ? <div className="billing-message">Billing is not configured on this server yet.</div> : billingMessage === "checkout" ? <div className="billing-message">Checkout could not be created. Please try again.</div> : billingMessage === "order" ? <div className="billing-message">We could not start the order. Please try again.</div> : null}{userId ? <form action="/api/billing/checkout" method="post"><input type="hidden" name="returnTo" value="/experiments/momentum-collisions" /><button className="pack-checkout-button" type="submit" disabled={!isSupabaseAdminConfigured()}><CreditCard size={16} />Unlock the pack</button></form> : <Link className="pack-checkout-button" href="/login?next=%2Fexperiments%2Fmomentum-collisions"><UserRound size={16} />Sign in to unlock</Link>}<small><ShieldCheck size={13} />No subscription. Refunds are handled by Waffo.</small></div>
      </section>
      <figure className="pack-preview"><Image src={previewImage.url} alt={previewImage.alt} width={previewImage.width} height={previewImage.height} priority /><figcaption><span>Actual experiment output</span><strong>Follow the collision, then compare momentum and kinetic energy without switching views.</strong></figcaption></figure>
    </div>
  </main>;
}
