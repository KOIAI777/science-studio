import type {Metadata} from "next";
import type {ReactNode} from "react";
import "./globals.css";
import "./home.css";
import "./library.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Science Studio | Interactive Physics Experiments for Teachers",
    template: "%s | Science Studio",
  },
  description: "Guided interactive physics experiments teachers can adjust, explain step by step, and present on any classroom screen.",
  keywords: [
    "interactive physics experiments",
    "physics simulations for teachers",
    "classroom physics demonstrations",
    "middle school physics",
    "high school physics",
    "science teaching tools",
  ],
  authors: [{name: "Science Studio"}],
  creator: "Science Studio",
  publisher: "Science Studio",
  applicationName: "Science Studio",
  category: "education",
  alternates: {canonical: "/"},
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Science Studio",
    title: "Interactive physics experiments, ready for class",
    description: "Adjust real lesson parameters, reveal forces and formulas step by step, and present the result on any classroom screen.",
    images: [{url: "/opengraph-image", width: 1200, height: 630, alt: "Science Studio interactive physics experiment"}],
  },
  twitter: {
    card: "summary_large_image",
    title: "Interactive physics experiments, ready for class",
    description: "Guided physics experiments for teacher-led classroom presentation.",
    images: ["/opengraph-image"],
  },
  robots: {index: true, follow: true},
};

export default function RootLayout({children}: {children: ReactNode}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
