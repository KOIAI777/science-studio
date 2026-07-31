import type {Metadata} from "next";
import {ArrowLeft, Check, CreditCard, FlaskConical, LockKeyhole, ShieldCheck} from "lucide-react";
import Link from "next/link";
import {redirect} from "next/navigation";
import {DcCircuitsWorkbench} from "../../../components/dc-circuits-workbench";
import {isSupabaseAdminConfigured} from "../../../lib/supabase/admin";
import {createClient} from "../../../lib/supabase/server";
import {MIDDLE_SCHOOL_PACK_PRICE_USD, MIDDLE_SCHOOL_PACK_SKU} from "../../../lib/waffo";

const pageTitle = "DC Circuits: Series & Parallel";
const socialTitle = `${pageTitle} | Science Studio`;
const description = "Compare single, series, and parallel DC circuits with synchronized current paths, component measurements, equivalent resistance, and guided classroom steps.";
const previewImage = {
  url: "/experiments/dc-circuits-diagram.png",
  width: 1280,
  height: 720,
  alt: "Science Studio series and parallel DC circuit comparison with synchronized current and voltage measurements",
};

export const metadata: Metadata = {
  title: pageTitle,
  description,
  robots: {index: false, follow: false},
  alternates: {canonical: "/experiments/dc-circuits"},
  openGraph: {
    type: "website",
    title: socialTitle,
    description,
    url: "/experiments/dc-circuits",
    images: [previewImage],
  },
  twitter: {
    card: "summary_large_image",
    title: socialTitle,
    description,
    images: [previewImage.url],
  },
};

interface DcCircuitsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DcCircuitsExperimentPage({searchParams}: DcCircuitsPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {data: claimsData} = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login?next=%2Fexperiments%2Fdc-circuits");

  const {data: entitlement} = await supabase
    .from("entitlements")
    .select("status")
    .eq("user_id", userId)
    .eq("sku", MIDDLE_SCHOOL_PACK_SKU)
    .eq("status", "active")
    .maybeSingle();
  if (entitlement?.status === "active") return <DcCircuitsWorkbench />;

  const billingMessage = first(params.billing);
  return (
    <main className="pack-access-page">
      <header className="site-header">
        <div className="site-header-inner">
          <Link className="site-brand" href="/" aria-label="Science Studio home"><span className="brand-mark"><FlaskConical size={17} /></span><strong>Science Studio</strong></Link>
          <nav className="site-nav" aria-label="Primary navigation"><Link href="/experiments">Experiment library</Link><Link className="active" href="/account">Account</Link></nav>
        </div>
      </header>
      <div className="pack-access-main">
        <div className="library-breadcrumb"><Link href="/experiments"><ArrowLeft size={14} />Experiment library</Link><span>/</span><span>Middle School Physics Foundations</span></div>
        <section className="pack-access-layout">
          <div className="pack-access-copy">
            <span className="section-kicker"><LockKeyhole size={14} />Teacher pack</span>
            <h1>Middle School Physics Foundations</h1>
            <p className="pack-access-lede">One focused pack for presenting forces, motion, energy, and circuits with the same classroom-ready controls.</p>
            <ul className="pack-access-list">
              <li><Check size={15} />DC Circuits: Series &amp; Parallel, available now</li>
              <li><Check size={15} />New released experiments added to this pack</li>
              <li><Check size={15} />One-time purchase, linked to your teacher account</li>
            </ul>
          </div>
          <div className="pack-access-card">
            <div className="pack-price"><strong>${MIDDLE_SCHOOL_PACK_PRICE_USD}</strong><span>one-time early access</span></div>
            <p>Secure checkout by Waffo Pancake. Access is granted after the signed payment event is confirmed.</p>
            {billingMessage === "configuration" ? <div className="billing-message">Billing is not configured on this server yet.</div> : billingMessage === "checkout" ? <div className="billing-message">Checkout could not be created. Please try again.</div> : billingMessage === "order" ? <div className="billing-message">We could not start the order. Please try again.</div> : null}
            <form action="/api/billing/checkout" method="post"><button className="pack-checkout-button" type="submit" disabled={!isSupabaseAdminConfigured()}><CreditCard size={16} />Unlock the pack</button></form>
            <small><ShieldCheck size={13} />No subscription. Refunds are handled by Waffo.</small>
          </div>
        </section>
      </div>
    </main>
  );
}
