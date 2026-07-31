interface ExperimentStructuredDataProps {
  name: string;
  description: string;
  path: string;
  image: string;
  teaches: string[];
  lessonMinutes: number;
  isFree: boolean;
  price?: string;
}

export function ExperimentStructuredData({name, description, path, image, teaches, lessonMinutes, isFree, price}: ExperimentStructuredDataProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:5173";
  const url = new URL(path, siteUrl).toString();
  const imageUrl = new URL(image, siteUrl).toString();
  const data = {
    "@context": "https://schema.org",
    "@type": ["SoftwareApplication", "LearningResource"],
    name,
    description,
    url,
    image: imageUrl,
    applicationCategory: "EducationalApplication",
    applicationSubCategory: "Interactive physics simulation",
    operatingSystem: "Web",
    inLanguage: "en",
    isAccessibleForFree: isFree,
    learningResourceType: "Interactive simulation",
    educationalLevel: "Middle school",
    timeRequired: `PT${lessonMinutes}M`,
    teaches,
    audience: {"@type": "EducationalAudience", educationalRole: "teacher"},
    offers: {"@type": "Offer", price: isFree ? "0" : price, priceCurrency: "USD", availability: "https://schema.org/InStock"},
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(data)}} />;
}
