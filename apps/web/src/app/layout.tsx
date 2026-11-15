import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "YeneSpot | Discover Local Businesses in Jimma, Ethiopia",
    template: "%s | YeneSpot",
  },
  description:
    "Find and explore coffee shops, restaurants, hotels and trusted local businesses in Jimma, Ethiopia with YeneSpot.",
  applicationName: "YeneSpot",
  keywords: [
    "YeneSpot",
    "Jimma businesses",
    "local businesses in Jimma",
    "restaurants in Jimma",
    "coffee shops in Jimma",
    "hotels in Jimma",
    "Ethiopia business directory",
  ],
  openGraph: {
    type: "website",
    title: "YeneSpot | Discover Local Businesses in Jimma",
    description:
      "Find coffee shops, restaurants, hotels and local businesses in Jimma, Ethiopia.",
    siteName: "YeneSpot",
    locale: "en_ET",
    alternateLocale: ["am_ET"],
  },
  twitter: {
    card: "summary",
    title: "YeneSpot | Discover Local Businesses in Jimma",
    description:
      "Find coffee shops, restaurants, hotels and local businesses in Jimma, Ethiopia.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
