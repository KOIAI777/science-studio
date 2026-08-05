interface BreadcrumbItem {
  name: string;
  path: string;
}

interface BreadcrumbStructuredDataProps {
  items: readonly BreadcrumbItem[];
}

export function BreadcrumbStructuredData({items}: BreadcrumbStructuredDataProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:5173";
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(({name, path}, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name,
      item: new URL(path, siteUrl).toString(),
    })),
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(data)}} />;
}
