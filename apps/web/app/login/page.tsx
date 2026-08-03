import type {Metadata} from "next";
import {ArrowLeft, Check, FlaskConical, KeyRound, Mail} from "lucide-react";
import Link from "next/link";
import {redirect} from "next/navigation";
import {normalizeAuthReturnPath} from "../../lib/auth";
import {isSupabaseConfigured} from "../../lib/supabase/config";
import {createClient} from "../../lib/supabase/server";
import {requestMagicLink} from "./actions";
import {TurnstileWidget} from "./turnstile-widget";

export const metadata: Metadata = {
  title: "Teacher sign in",
  description: "Sign in to the Science Studio teacher account area.",
  robots: {index: false, follow: false},
};

const errorMessages: Record<string, string> = {
  invalid_email: "Enter a valid email address.",
  configuration: "Sign-in is not configured yet. Try again later.",
  security: "Complete the security check and try again.",
  send_failed: "We could not send the sign-in email. Wait a moment and try again.",
};

export default async function LoginPage({searchParams}: {searchParams: Promise<Record<string, string | string[] | undefined>>}) {
  const parameters = await searchParams;
  const errorKey = typeof parameters.error === "string" ? parameters.error : undefined;
  const sentTo = typeof parameters.sent === "string" ? parameters.sent : undefined;
  const next = normalizeAuthReturnPath(typeof parameters.next === "string" ? parameters.next : undefined);
  const supabaseConfigured = isSupabaseConfigured();
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  const loginConfigured = supabaseConfigured && Boolean(turnstileSiteKey);

  if (supabaseConfigured) {
    const supabase = await createClient();
    const {data} = await supabase.auth.getClaims();
    if (data?.claims?.sub) redirect(next);
  }

  return (
    <main className="auth-page">
      <Link className="auth-back-link" href="/"><ArrowLeft size={15} />Back to Science Studio</Link>
      <section className="auth-layout">
        <div className="auth-intro">
          <span className="auth-brand-mark"><FlaskConical size={20} /></span>
          <span className="auth-kicker">Teacher account</span>
          <h1>Keep your classroom physics library in one place.</h1>
          <p>Free experiments stay open to everyone. Sign in when you need to purchase a pack or access teacher-only content.</p>
          <ul>
            <li><Check size={15} />No password to remember</li>
            <li><Check size={15} />Purchases attach to one verified email</li>
            <li><Check size={15} />Students do not need accounts</li>
          </ul>
        </div>

        <div className="auth-form-panel">
          {sentTo ? (
            <div className="auth-sent-state" role="status">
              <span><Mail size={22} /></span>
              <h2>Check your email</h2>
              <p>We sent a one-time sign-in link to <strong>{sentTo}</strong>.</p>
              <small>The link expires after one hour and can only be used once.</small>
              <Link href={`/login?next=${encodeURIComponent(next)}`}>Use another email</Link>
            </div>
          ) : (
            <>
              <span className="auth-form-icon"><KeyRound size={18} /></span>
              <h2>Sign in with email</h2>
              <p>We will send you a secure one-time link.</p>
              {(errorKey || !loginConfigured) && <div className="auth-message error" role="alert">{errorMessages[errorKey ?? "configuration"] ?? errorMessages.send_failed}</div>}
              <form action={requestMagicLink}>
                <input type="hidden" name="next" value={next} />
                <label htmlFor="email">Email address</label>
                <input id="email" name="email" type="email" autoComplete="email" inputMode="email" placeholder="teacher@school.org" required maxLength={254} autoFocus />
                {turnstileSiteKey && <TurnstileWidget siteKey={turnstileSiteKey} />}
                <button type="submit" disabled={!loginConfigured}>Email me a sign-in link<Mail size={16} /></button>
              </form>
              <small className="auth-privacy-note">By continuing, you agree to the <Link href="/terms">Terms of Service</Link> and acknowledge the <Link href="/privacy">Privacy Policy</Link>.</small>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
