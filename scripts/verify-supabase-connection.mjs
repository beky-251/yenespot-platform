import fs from "node:fs";

const envPath = "apps/web/.env.local";
const envText = fs.readFileSync(envPath, "utf8");

const env = Object.fromEntries(
  envText.split(/\r?\n/).filter(Boolean).map((line) => {
    const index = line.indexOf("=");
    return [line.slice(0, index), line.slice(index + 1).trim()];
  })
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("FAIL: Required public Supabase environment variables are missing.");
  process.exit(1);
}

const endpoint = new URL("/rest/v1/business_categories", url);
endpoint.searchParams.set("select", "name,name_am,slug,sort_order");
endpoint.searchParams.set("is_active", "eq.true");
endpoint.searchParams.set("order", "sort_order.asc");

try {
  const response = await fetch(endpoint, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    console.error("FAIL: Supabase database request failed.");
    console.error("HTTP status:", response.status);
    console.error("Error:", result.message || result.error || "Unknown error");
    process.exit(1);
  }

  console.log("\nSUCCESS: Connected to YeneSpot Supabase!");
  console.log("Active categories retrieved:", result.length);
  console.table(result);

  if (result.length !== 10) {
    console.warn("WARNING: Expected 10 active categories.");
  }
} catch (error) {
  console.error("FAIL: Could not reach Supabase.");
  console.error(error.message);
  process.exit(1);
}
