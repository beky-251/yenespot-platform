export type UserRole =
  | "customer"
  | "business_owner"
  | "admin"
  | "super_admin";

export type BusinessStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "suspended";

export type SubscriptionStatus =
  | "free"
  | "trial"
  | "active"
  | "expired"
  | "cancelled"
  | "suspended";

export const BUSINESS_CATEGORIES = [
  "Coffee Shops",
  "Restaurants",
  "Hotels",
  "Cake Houses",
  "Cafes",
  "Juice Houses",
  "Bars",
  "Fast Food",
  "Bakeries",
  "Other Businesses"
] as const;

export type BusinessCategory =
  (typeof BUSINESS_CATEGORIES)[number];

export type SupportedLanguage = "en" | "am";
