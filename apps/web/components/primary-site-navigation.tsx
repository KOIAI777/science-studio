import Link from "next/link";

type NavigationDestination = "guides" | "experiments";

interface PrimarySiteNavigationProps {
  active?: NavigationDestination;
  labels?: {
    workflow: string;
    pricing: string;
    faq: string;
    guides: string;
    experiments: string;
  };
}

const defaultLabels = {
  workflow: "How it works",
  pricing: "Pricing",
  faq: "FAQ",
  guides: "Teaching guides",
  experiments: "Experiment library",
};

export function PrimarySiteNavigation({active, labels = defaultLabels}: PrimarySiteNavigationProps) {
  return (
    <nav className="site-nav" aria-label="Primary navigation">
      <Link href="/#workflow">{labels.workflow}</Link>
      <Link href="/#pricing">{labels.pricing}</Link>
      <Link href="/#faq">{labels.faq}</Link>
      <span className="site-nav-separator" aria-hidden="true" />
      <Link className={active === "guides" ? "active" : undefined} href="/teaching-guides">{labels.guides}</Link>
      <Link className={active === "experiments" ? "active" : undefined} href="/experiments">{labels.experiments}</Link>
    </nav>
  );
}
