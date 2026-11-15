import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  const supabase = await createClient();

  const { data: businesses } = await supabase
    .from("businesses")
    .select("slug")
    .eq("status", "approved");

  return [
    {
      url: baseUrl,
      changeFrequency: "daily",
      priority: 1,
    },
    ...(businesses ?? []).map((business) => ({
      url: `${baseUrl}/business/${business.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}