import { SITE_URL } from "@/lib/site";

// Shared looks (/look/*) are private, short-lived customer photos: never index them.
export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/look/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
