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
  const organizationId = new URL("/#organization", siteUrl).toString();
  const applicationData = {
    "@type": ["SoftwareApplication", "LearningResource"],
    name,
    description,
    url,
    image: imageUrl,
    applicationCategory: "EducationalApplication",
    applicationSubCategory: "Interactive physics simulation",
    brand: {"@type": "Brand", name: "Science Studio", alternateName: "Science Studio by ClassroomLab"},
    provider: {"@id": organizationId},
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
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      applicationData,
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {"@type": "ListItem", position: 1, name: "Home", item: new URL("/", siteUrl).toString()},
          {"@type": "ListItem", position: 2, name: "Experiment library", item: new URL("/experiments", siteUrl).toString()},
          {"@type": "ListItem", position: 3, name, item: url},
        ],
      },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(data)}} />;
}
