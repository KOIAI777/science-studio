import type {Metadata} from "next";
import {ArrowLeft, BookOpen, FlaskConical, LogOut, ShieldCheck, UserRound} from "lucide-react";
import Link from "next/link";
import {redirect} from "next/navigation";
import {formatAccountRole} from "../../lib/auth";
import {isSupabaseConfigured} from "../../lib/supabase/config";
import {createClient} from "../../lib/supabase/server";
import {signOut} from "./actions";

export const metadata: Metadata = {
  title: "Teacher account",
  description: "Manage your Science Studio teacher account and experiment access.",
  robots: {index: false, follow: false},
};

export default async function AccountPage() {
  if (!isSupabaseConfigured()) redirect("/login?error=configuration&next=%2Faccount");

  const supabase = await createClient();
  const {data: claimsData} = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login?next=%2Faccount");

  const {data: userData} = await supabase.auth.getUser();
  if (!userData.user) redirect("/login?next=%2Faccount");

  const {data: profile} = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", userData.user.id)
    .maybeSingle();

  const {data: entitlement} = await supabase
    .from("entitlements")
    .select("sku, status")
    .eq("user_id", userData.user.id)
    .eq("status", "active")
    .maybeSingle();

  const role = formatAccountRole(profile?.role);
  const name = profile?.display_name?.trim() || role;

  return (
    <div className="account-page">
      <header className="site-header">
        <div className="site-header-inner">
          <Link className="site-brand" href="/" aria-label="Science Studio home"><span className="brand-mark"><FlaskConical size={17} /></span><strong>Science Studio</strong></Link>
          <nav className="site-nav" aria-label="Account navigation"><Link href="/experiments">Experiment library</Link><Link className="active" href="/account">Account</Link></nav>
          <form className="site-actions" action={signOut}><button className="header-account-link" type="submit" aria-label="Sign out" title="Sign out"><LogOut size={15} /><span>Sign out</span></button></form>
        </div>
      </header>

      <main className="account-main">
        <div className="library-breadcrumb"><Link href="/experiments"><ArrowLeft size={14} />Experiment library</Link><span>/</span><span>Account</span></div>
        <section className="account-heading">
          <div><span className="section-kicker">Teacher account</span><h1>{name}</h1><p>{userData.user.email}</p></div>
          <span className="account-role"><ShieldCheck size={15} />{role}</span>
        </section>

        <section className="account-sections">
          <article className="account-section">
            <span className="account-section-icon"><UserRound size={18} /></span>
            <div><span className="account-label">Account access</span><h2>Email magic link</h2><p>Your verified email is the identity used for future purchases and access recovery.</p></div>
          </article>
          <article className="account-section">
            <span className="account-section-icon"><BookOpen size={18} /></span>
            <div><span className="account-label">Your library</span><h2>{entitlement ? "Middle School Physics Foundations" : "Free Starter"}</h2><p>{entitlement ? "Your paid pack is active. DC Circuits, Waves, Density & Buoyancy, and Momentum & Collisions are ready in the released experiment library." : "Four classroom experiments are available without a purchase. Your paid packs will appear here after checkout."}</p><Link href="/experiments">Open experiment library</Link></div>
          </article>
        </section>
      </main>
    </div>
  );
}
