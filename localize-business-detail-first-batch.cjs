const fs = require("fs");

const file = process.argv[2];
const source = fs.readFileSync(file, "utf8");
const nl = source.includes("\r\n") ? "\r\n" : "\n";

function replaceExact(text, original, replacement, label) {
  const first = text.indexOf(original);
  const last = text.lastIndexOf(original);

  if (first === -1 || first !== last) {
    throw new Error(`${label}: expected exactly one match. No changes saved.`);
  }

  return text.slice(0, first) + replacement + text.slice(first + original.length);
}

const replacements = [
  [
    '              {category?.name || "Local business"}',
    '              {isAmharic ? category?.name_am || category?.name || "\\u12E8\\u12A0\\u12AB\\u1263\\u1262 \\u12F5\\u122D\\u1305\\u1275" : category?.name || "Local business"}',
    "Hero category name"
  ],
  [
    '              {category?.icon || "\\uD83D\\uDCCD"} {category?.name || "Local business"}' + nl +
    '              {category?.name_am ? ` \\u00B7 ${category.name_am}` : ""}',
    '              {category?.icon || "\\uD83D\\uDCCD"} {isAmharic ? category?.name_am || category?.name || "\\u12E8\\u12A0\\u12AB\\u1263\\u1262 \\u12F5\\u122D\\u1305\\u1275" : category?.name || "Local business"}',
    "Business category name"
  ],
  [
    '<Text style={styles.verifiedText}>{"\\u2713"} Verified</Text>',
    '<Text style={styles.verifiedText}>{"\\u2713"} {t("Verified", "\\u12E8\\u1270\\u1228\\u130B\\u1308\\u1320")}</Text>',
    "Verified badge"
  ],
  [
    '({business.review_count} reviews)',
    '({business.review_count} {t("reviews", "\\u130D\\u121D\\u1308\\u121B\\u12CE\\u127D")})',
    "Review count"
  ],
  [
    '<Text style={styles.primaryActionText}>{"\\u260E"} Call</Text>',
    '<Text style={styles.primaryActionText}>{"\\u260E"} {t("Call", "\\u12ED\\u12F0\\u12CD\\u1209")}</Text>',
    "Call button"
  ],
  [
    '<Text style={styles.secondaryActionText}>{"\\u2197"} Website</Text>',
    '<Text style={styles.secondaryActionText}>{"\\u2197"} {t("Website", "\\u12F5\\u122D\\u1305\\u1275 \\u12C8\\u12ED\\u121D \\u12F5\\u1228-\\u1308\\u133D")}</Text>',
    "Website button"
  ],
  [
    '                {isFavorite' + nl +
    '                  ? "\\u2665  Saved to your favorites"' + nl +
    '                  : "\\u2661  Add to favorites"}',
    '                {isFavorite' + nl +
    '                  ? `\\u2665  ${t("Saved to your favorites", "\\u12C8\\u12F0 \\u1270\\u12C8\\u12F3\\u1305\\u1276\\u127D \\u1270\\u1328\\u121D\\u122F\\u120D")}`' + nl +
    '                  : `\\u2661  ${t("Add to favorites", "\\u12C8\\u1270\\u12C8\\u12F3\\u1305\\u1276\\u127D \\u1328\\u121D\\u122D")}`}',
    "Favorite button"
  ],
  [
    '<Text style={styles.sectionTitle}>About this place</Text>',
    '<Text style={styles.sectionTitle}>{t("About this place", "\\u1260\\u12DA\\u1205 \\u1266\\u1273 \\u1235\\u1208\\u121A\\u12AB\\u1204")}</Text>',
    "About heading"
  ],
  [
    '"Discover this local business on YeneSpot."',
    't("Discover this local business on YeneSpot.", "\\u12ED\\u1205\\u1295\\u1295 \\u12E8\\u12A0\\u12AB\\u1263\\u1262 \\u12F5\\u122D\\u1305\\u1275 \\u1260YeneSpot \\u12ED\\u12C8\\u1241\\u1362")',
    "About fallback"
  ],
  [
    '<Text style={styles.sectionTitle}>Location</Text>',
    '<Text style={styles.sectionTitle}>{t("Location", "\\u12A0\\u12F5\\u122B\\u123B")}</Text>',
    "Location heading"
  ],
  [
    '                Get directions in Google Maps',
    '                {t("Get directions in Google Maps", "\\u1260Google Maps \\u12A0\\u1265\\u122B\\u12CB\\u127D")}',
    "Directions button"
  ],
  [
    '<Text style={styles.infoTitle}>Email</Text>',
    '<Text style={styles.infoTitle}>{t("Email", "\\u12A2\\u121C\\u12ED\\u120D")}</Text>',
    "Email label"
  ],
  [
    '<Text style={styles.sectionTitle}>Opening hours</Text>',
    '<Text style={styles.sectionTitle}>{t("Opening hours", "\\u12E8\\u1235\\u122B \\u1230\\u12D3\\u1275")}</Text>',
    "Opening hours heading"
  ],
  [
    '{isOpenNow ? "Open now" : "Closed now"}',
    '{isOpenNow ? t("Open now", "\\u12A0\\u1201\\u1295 \\u12ED\\u1218\\u1208\\u1233\\u120D") : t("Closed now", "\\u12A0\\u1201\\u1295 \\u12DD\\u130D\\u1277\\u120D")}',
    "Open status"
  ],
  [
    '                  Opening hours have not been provided.',
    '                  {t("Opening hours have not been provided.", "\\u12E8\\u1235\\u122B \\u1230\\u12D3\\u1275 \\u1218\\u1228\\u1303 \\u12A0\\u120D\\u1270\\u1228\\u1348\\u121D\\u1362")}',
    "Opening hours fallback"
  ],
  [
    '{DAYS[hour.day_of_week] ?? "Day"}',
    '{(isAmharic ? DAYS_AM : DAYS)[hour.day_of_week] ?? t("Day", "\\u1240\\u1295")}',
    "Weekday display"
  ],
  [
    '? "Closed"',
    '? t("Closed", "\\u12DD\\u130D\\u1277\\u120D")',
    "Closed day label"
  ]
];

let updated = source;

for (const [original, replacement, label] of replacements) {
  updated = replaceExact(updated, original, replacement, label);
}

const backup = file + ".before-business-info-amharic";

if (fs.existsSync(backup)) {
  throw new Error("Backup already exists. No changes saved.");
}

fs.copyFileSync(file, backup);
fs.writeFileSync(file, updated, "utf8");

console.log("SUCCESS: First translation batch applied.");
console.log("Replacements:", replacements.length);
console.log("Backup:", backup);
console.log("Original line endings preserved.");
