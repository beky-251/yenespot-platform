"use client";

import { useState } from "react";
import Link from "next/link";

type Language = "en" | "am";

export default function HomeHeaderControls({ initialLanguage, isLoggedIn }: { initialLanguage: Language; isLoggedIn: boolean }) {
  const [language, setLanguage] = useState<Language>(initialLanguage);

  function changeLanguage(next: Language) {
    document.cookie = `yenespot_app_language=${next}; path=/; max-age=31536000; samesite=lax`;
    setLanguage(next);
    window.location.reload();
  }

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <button type="button" onClick={() => changeLanguage(language === "en" ? "am" : "en")} className="rounded-lg border border-border px-2 py-2 text-xs font-semibold text-navy sm:px-3 sm:text-sm transition hover:border-green hover:text-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2" aria-label="Change language">
        {language === "en" ? "áŠ áˆ›" : "EN"}
      </button>
      <Link href={isLoggedIn ? "/profile" : "/login"} className="rounded-lg border border-green whitespace-nowrap px-2 py-2 text-xs font-semibold text-green sm:px-3 sm:text-sm transition hover:bg-green/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2">
        {isLoggedIn ? (language === "en" ? "My Profile" : "\u1218\u1308\u1208\u132b") : (language === "en" ? "Login" : "\u130d\u1263")}
      </Link>
      
    </div>
  );
}