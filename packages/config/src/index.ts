import {
  BUSINESS_CATEGORIES,
  type SupportedLanguage
} from "@yenespot/shared";

export const APP_CONFIG = {
  name: "YeneSpot",
  description: "Discover local businesses around you",
  defaultCity: "Jimma",
  defaultCountry: "Ethiopia",
  defaultLanguage: "en" as SupportedLanguage,
  supportedLanguages: ["en", "am"] as const,
  categories: BUSINESS_CATEGORIES
} as const;

export const BRAND_COLORS = {
  navy: "#172B3A",
  green: "#173B35",
  gold: "#D5A642",
  cream: "#FAF9F6",
  white: "#FFFFFF",
  charcoal: "#292D32"
} as const;
