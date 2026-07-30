import {ExperimentCatalogHome} from "../components/experiment-catalog-home";

export default function HomePage() {
  const faqItems = [
    ["Is Science Studio a replacement for physical labs?", "No. It is a classroom explanation and demonstration tool that makes forces, motion, equations, and model assumptions visible before or after hands-on work."],
    ["Do students need accounts?", "No. The first version is teacher-led and designed for projectors, interactive whiteboards, and shared screens."],
    ["Which grade levels are supported?", "The library is organized into elementary, middle school, and high school, with three released experiments currently targeting middle-school mechanics."],
    ["Are the calculations scientifically verified?", "Released experiments use deterministic solvers, explicit SI units, documented assumptions, parameter validation, and automated tests."],
    ["What can I use for free?", "Inclined Plane and Friction, Energy Track, and Forces and Motion are free, including parameter controls, measurements, science checks, and guided explanation steps."],
  ];
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Science Studio",
      url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
      description: "Guided interactive physics experiments for classroom presentation.",
      inLanguage: "en",
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Science Studio",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      description: "Interactive physics experiments teachers can adjust and present step by step.",
      audience: {"@type": "EducationalAudience", educationalRole: "teacher"},
      offers: {"@type": "Offer", price: "0", priceCurrency: "USD", description: "Three free classroom physics experiments"},
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map(([name, text]) => ({
        "@type": "Question",
        name,
        acceptedAnswer: {"@type": "Answer", text},
      })),
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(structuredData)}} />
      <ExperimentCatalogHome />
    </>
  );
}
