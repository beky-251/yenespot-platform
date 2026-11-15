import { cookies } from "next/headers";

export type AppLanguage = "en" | "am";

export async function getAppLanguage(): Promise<AppLanguage> {
  const cookieStore = await cookies();
  return cookieStore.get("yenespot_app_language")?.value === "am" ? "am" : "en";
}

export function t(language: AppLanguage, english: string, amharic: string): string {
  return language === "am" ? amharic : english;
}