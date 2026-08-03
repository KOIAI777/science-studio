import type {Metadata} from "next";
import {ArrowLeft, BookOpen, CheckCircle2, FlaskConical, GraduationCap, LogOut, ShieldCheck, UserRound} from "lucide-react";
import Link from "next/link";
import {redirect} from "next/navigation";
import {PrimarySiteNavigation} from "../../components/primary-site-navigation";
import {formatAccountRole} from "../../lib/auth";
import {isSupabaseConfigured} from "../../lib/supabase/config";
import {createClient} from "../../lib/supabase/server";
import {signOut} from "./actions";

export const metadata: Metadata = {
  title: "Teacher account",
  description: "Manage your Science Studio teacher account and experiment access.",
  robots: {index: false, follow: false},
};

interface AccountPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AccountPage({searchParams}: AccountPageProps) {
  const params = await searchParams;
  const requestedPreview = first(params.preview);
  const previewMode = process.env.NODE_ENV === "development" && (requestedPreview === "free" || requestedPreview === "paid") ? requestedPreview : undefined;
  let role = "Teacher";
  let name = "Teacher preview";
  let email = "teacher@school.org";
  let entitlementActive = previewMode === "paid";

  if (!previewMode) {
    if (!isSupabaseConfigured()) redirect("/login?error=configuration&next=%2Faccount");

    const supabase = await createClient();
    const {data: claimsData} = await supabase.auth.getClaims();
    if (!claimsData?.claims?.sub) redirect("/login?next=%2Faccount");

    const {data: userData} = await supabase.auth.getUser();
    if (!userData.user) redirect("/login?next=%2Faccount");

    const [{data: profile}, {data: entitlement}] = await Promise.all([
      supabase.from("profiles").select("display_name, role").eq("id", userData.user.id).maybeSingle(),
      supabase.from("entitlements").select("sku, status").eq("user_id", userData.user.id).eq("status", "active").maybeSingle(),
    ]);

    role = formatAccountRole(profile?.role);
    name = profile?.display_name?.trim() || role;
    email = userData.user.email ?? "Verified teacher account";
    entitlementActive = entitlement?.status === "active";
  }

  return (
    <div className="account-page">
      <header className="site-header">
        <div className="site-header-inner">
          <Link className="site-brand" href="/" aria-label="Science Studio home"><span className="brand-mark"><FlaskConical size={17} /></span><strong>Science Studio</strong></Link>
          <PrimarySiteNavigation />
          <form className="site-actions" action={signOut}><button className="header-account-link" type="submit" aria-label="Sign out" title="Sign out"><LogOut size={15} /><span>Sign out</span></button></form>
        </div>
      </header>

      <main className="account-main">
        <div className="library-breadcrumb"><Link href="/experiments"><ArrowLeft size={14} />Experiment library</Link><span>/</span><span>Account</span></div>
        <section className="account-heading">
          <div><span className="section-kicker">Teacher account</span><h1>{name}</h1><p>{email}</p></div>
          <span className="account-role"><ShieldCheck size={15} />{role}</span>
        </section>

        <section className={`account-entitlement-summary ${entitlementActive ? "active" : "free"}`}>
          <div className="account-entitlement-heading">
            <span className="account-entitlement-badge">{entitlementActive ? <CheckCircle2 size={15} /> : <BookOpen size={15} />}{entitlementActive ? "Active pack" : "Free access"}</span>
            <h2>{entitlementActive ? "Middle School Physics Foundations" : "Free Starter"}</h2>
            <p>{entitlementActive ? "Your one-time teacher access is active. All released Middle School pack experiments and future classroom-ready additions to this pack are included." : "Four complete experiments are ready without a purchase. Unlock the Middle School pack once to add ten paid experiments and its future reviewed additions."}</p>
          </div>
          <dl className="account-access-facts">
            <div><dt>{entitlementActive ? "10" : "4"}</dt><dd>{entitlementActive ? "paid experiments available now" : "free experiments available now"}</dd></div>
            <div><dt>{entitlementActive ? "Included" : "10"}</dt><dd>{entitlementActive ? "future Middle School additions" : "experiments in the paid pack"}</dd></div>
            <div><dt>{entitlementActive ? "One-time" : "Next"}</dt><dd>{entitlementActive ? "teacher access, no subscription" : "High School support is planned"}</dd></div>
          </dl>
          <div className="account-entitlement-actions">
            <Link className="account-primary-action" href="/experiments">Open experiment library</Link>
            {!entitlementActive && <Link className="account-secondary-action" href="/experiments/dc-circuits">View Middle School Pack</Link>}
          </div>
        </section>

        <section className="account-sections">
          <article className="account-section">
            <span className="account-section-icon"><UserRound size={18} /></span>
            <div><span className="account-label">Account access</span><h2>Email magic link</h2><p>Your verified email is the identity used for future purchases and access recovery.</p></div>
          </article>
          <article className="account-section">
            <span className="account-section-icon"><GraduationCap size={18} /></span>
            <div><span className="account-label">Curriculum roadmap</span><h2>High School Physics is in development</h2><p>Advanced high-school experiments will be released as a separate future pack after classroom and scientific review. Middle School access does not include that future collection.</p><Link href="/#pricing">View curriculum plans</Link></div>
          </article>
        </section>
      </main>
    </div>
  );
}
