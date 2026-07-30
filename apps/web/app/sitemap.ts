import type {MetadataRoute} from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return [
    {url: siteUrl, changeFrequency: "weekly", priority: 1},
    {url: `${siteUrl}/experiments`, changeFrequency: "weekly", priority: 0.9},
    {url: `${siteUrl}/experiments/inclined-plane`, changeFrequency: "monthly", priority: 0.9},
    {url: `${siteUrl}/experiments/energy-track`, changeFrequency: "monthly", priority: 0.9},
  ];
}
