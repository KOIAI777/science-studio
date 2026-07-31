import type {Metadata} from "next";
import {AlertTriangle, ArrowLeft} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign-in link error",
  robots: {index: false, follow: false},
};

export default function AuthErrorPage() {
  return (
    <main className="auth-page auth-error-page">
      <section className="auth-error-panel">
        <AlertTriangle size={24} />
        <span className="auth-kicker">Sign-in link error</span>
        <h1>This sign-in link is no longer valid.</h1>
        <p>Magic links can only be used once and expire after one hour. Request a new link to continue.</p>
        <Link href="/login">Request another link</Link>
        <Link className="auth-secondary-link" href="/"><ArrowLeft size={14} />Back to Science Studio</Link>
      </section>
    </main>
  );
}
