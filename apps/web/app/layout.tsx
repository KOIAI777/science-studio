import type {Metadata} from "next";
import type {ReactNode} from "react";
import {Analytics} from "@vercel/analytics/next";
import "./globals.css";
import "./home.css";
import "./library.css";
import "./auth.css";
import "./legal.css";
import "./guides.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const organizationId = new URL("/#organization", siteUrl).toString();
const websiteId = new URL("/#website", siteUrl).toString();
const softwareId = new URL("/#science-studio", siteUrl).toString();

const brandStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": organizationId,
      name: "ClassroomLab",
      url: siteUrl,
      logo: new URL("/icon.svg", siteUrl).toString(),
      email: "support@classroomlab.online",
      founder: {"@type": "Person", name: "Jia Zhenghao"},
      brand: {"@type": "Brand", name: "Science Studio", alternateName: "Science Studio by ClassroomLab"},
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      name: "Science Studio",
      alternateName: ["Science Studio by ClassroomLab", "ClassroomLab"],
      url: siteUrl,
      inLanguage: ["en", "zh-CN"],
      publisher: {"@id": organizationId},
    },
    {
      "@type": "SoftwareApplication",
      "@id": softwareId,
      name: "Science Studio",
      alternateName: "Science Studio by ClassroomLab",
      url: siteUrl,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      description: "Interactive physics experiments teachers can adjust and present step by step.",
      provider: {"@id": organizationId},
      isPartOf: {"@id": websiteId},
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Science Studio by ClassroomLab | Physics Simulations",
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
  authors: [{name: "ClassroomLab", url: "/"}],
  creator: "ClassroomLab",
  publisher: "ClassroomLab",
  applicationName: "Science Studio by ClassroomLab",
  category: "education",
  alternates: {canonical: "/"},
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Science Studio by ClassroomLab",
    title: "Interactive physics experiments, ready for class",
    description: "Adjust real lesson parameters, reveal forces and formulas step by step, and present the result on any classroom screen.",
    images: [{url: "/opengraph-image", width: 1200, height: 630, alt: "Science Studio by ClassroomLab interactive physics experiment"}],
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
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(brandStructuredData)}} />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
