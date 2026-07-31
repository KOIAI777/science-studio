import type {Metadata} from "next";
import {ArrowLeft, ArrowRight, ShieldCheck} from "lucide-react";
import Link from "next/link";
import {normalizeAuthReturnPath, parseAuthConfirmation} from "../../../lib/auth";
import {confirmMagicLink} from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Confirm sign in",
  referrer: "no-referrer",
  robots: {index: false, follow: false},
};

type SearchParameters = Record<string, string | string[] | undefined>;

function singleValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

export default async function ConfirmSignInPage({searchParams}: {searchParams: Promise<SearchParameters>}) {
  const parameters = await searchParams;
  const code = singleValue(parameters.code);
  const tokenHash = singleValue(parameters.token_hash);
  const type = singleValue(parameters.type);
  const next = normalizeAuthReturnPath(singleValue(parameters.next));
  const confirmation = parseAuthConfirmation({code, tokenHash, type});

  if (!confirmation) {
    return (
      <main className="auth-page auth-error-page">
        <section className="auth-error-panel">
          <ShieldCheck size={24} />
          <span className="auth-kicker">Sign-in link error</span>
          <h1>This sign-in link is incomplete.</h1>
          <p>Request a new email to get a complete, secure sign-in link.</p>
          <Link href={`/login?next=${encodeURIComponent(next)}`}>Request another link</Link>
          <Link className="auth-secondary-link" href="/"><ArrowLeft size={14} />Back to Science Studio</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page auth-confirm-page">
      <section className="auth-confirm-panel">
        <span className="auth-confirm-icon"><ShieldCheck size={23} /></span>
        <span className="auth-kicker">Secure teacher sign in</span>
        <h1>Confirm your sign-in</h1>
        <p>Only continue if you requested this email. The link remains unused until you confirm below.</p>
        <form action={confirmMagicLink}>
          <input type="hidden" name="next" value={next} />
          {confirmation.kind === "code" ? (
            <input type="hidden" name="code" value={confirmation.code} />
          ) : (
            <>
              <input type="hidden" name="token_hash" value={confirmation.tokenHash} />
              <input type="hidden" name="type" value="email" />
            </>
          )}
          <button type="submit">Continue to Science Studio<ArrowRight size={16} /></button>
        </form>
        <Link className="auth-secondary-link" href="/"><ArrowLeft size={14} />Cancel and return home</Link>
      </section>
    </main>
  );
}
