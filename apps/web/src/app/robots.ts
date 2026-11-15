import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/super-admin/",
        "/profile/",
        "/favorites/",
        "/my-reviews/",
        "/notifications/",
        "/business/dashboard/",
        "/business/hours/",
        "/business/notifications/",
        "/business/profile/",
        "/business/reviews/",
        "/business/services/",
        "/business/apply/",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/auth/",
      ],
    },
  };
}