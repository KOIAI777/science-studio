import type {MetadataRoute} from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return [
    {url: siteUrl, changeFrequency: "weekly", priority: 1},
    {url: `${siteUrl}/experiments`, changeFrequency: "weekly", priority: 0.9},
    {url: `${siteUrl}/experiments/inclined-plane`, changeFrequency: "monthly", priority: 0.9},
    {url: `${siteUrl}/experiments/energy-track`, changeFrequency: "monthly", priority: 0.9},
    {url: `${siteUrl}/experiments/forces-and-motion`, changeFrequency: "monthly", priority: 0.9},
    {url: `${siteUrl}/experiments/ohms-law`, changeFrequency: "monthly", priority: 0.9},
    {url: `${siteUrl}/experiments/dc-circuits`, changeFrequency: "monthly", priority: 0.8},
    {url: `${siteUrl}/experiments/waves`, changeFrequency: "monthly", priority: 0.8},
    {url: `${siteUrl}/experiments/density-buoyancy`, changeFrequency: "monthly", priority: 0.8},
    {url: `${siteUrl}/experiments/momentum-collisions`, changeFrequency: "monthly", priority: 0.8},
    {url: `${siteUrl}/experiments/refraction-total-internal-reflection`, changeFrequency: "monthly", priority: 0.8},
    {url: `${siteUrl}/experiments/levers-and-balance`, changeFrequency: "monthly", priority: 0.8},
    {url: `${siteUrl}/experiments/sound-waves`, changeFrequency: "monthly", priority: 0.8},
    {url: `${siteUrl}/experiments/electrical-power-energy`, changeFrequency: "monthly", priority: 0.8},
    {url: `${siteUrl}/experiments/electromagnets`, changeFrequency: "monthly", priority: 0.8},
    {url: `${siteUrl}/experiments/lenses-image-formation`, changeFrequency: "monthly", priority: 0.8},
    {url: `${siteUrl}/terms`, changeFrequency: "yearly", priority: 0.3},
    {url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.3},
    {url: `${siteUrl}/refund-policy`, changeFrequency: "yearly", priority: 0.3},
    {url: `${siteUrl}/contact`, changeFrequency: "yearly", priority: 0.4},
  ];
}
