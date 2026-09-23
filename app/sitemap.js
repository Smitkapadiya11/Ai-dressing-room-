import { SITE_URL } from "@/lib/site";

export default function sitemap() {
  const now = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/mirror`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];
}
