const fs = require("fs");

const file = process.argv[2];
const source = fs.readFileSync(file, "utf8");

function replaceExact(text, original, replacement, label) {
  const nl = text.includes("\r\n") ? "\r\n" : "\n";
  original = original.replace(/\r?\n/g, nl);
  replacement = replacement.replace(/\r?\n/g, nl);
  const first = text.indexOf(original);
  const last = text.lastIndexOf(original);

  if (first === -1 || first !== last) {
    throw new Error(`${label}: expected exactly one match. No changes saved.`);
  }

  return text.slice(0, first) + replacement + text.slice(first + original.length);
}

const replacements = [
  ['<Text style={styles.sectionTitle}>Customer reviews</Text>',
   '<Text style={styles.sectionTitle}>{t("Customer reviews", "\\u12E8\\u12F0\\u1295\\u1260\\u129E\\u127D \\u1320\\u1208\\u1275")}</Text>', "Reviews heading"],

  ['? "Your review"\n                  : "Share your experience"',
   '? t("Your review", "\\u12E8\\u12A5\\u1235\\u12AD\\u122D\\u1293 \\u1320\\u1208\\u1275")\n                  : t("Share your experience", "\\u12E8\\u12A5\\u1235\\u12AD\\u122D\\u1293 \\u1270\\u121E\\u12AD\\u122E \\u12EB\\u130B\\u1229")', "Review form title"],

  ['                    Sign in to rate and review this business.',
   '                    {t("Sign in to rate and review this business.", "\\u12ED\\u1205\\u1295 \\u1262\\u12DD\\u1290\\u1235 \\u12CB\\u130B \\u1208\\u1218\\u1275\\u12A8\\u1275 \\u12A5\\u1293 \\u1320\\u1208\\u1275 \\u1208\\u1218\\u133B\\u134D \\u12ED\\u130D\\u1261")}.', "Sign-in description"],

  ['                      Sign in to write a review',
   '                      {t("Sign in to write a review", "\\u1320\\u1208\\u1275 \\u1208\\u1218\\u133B\\u134D \\u12ED\\u130D\\u1261")}', "Sign-in button"],

  ['                  Customer accounts can write reviews. Business owners and administrators cannot submit customer reviews.',
   '                  {t("Customer accounts can write reviews. Business owners and administrators cannot submit customer reviews.", "\\u1320\\u1208\\u1275 \\u1218\\u133B\\u134D \\u12E8\\u121A\\u127D\\u1209 \\u12E8\\u12F0\\u1295\\u1260\\u129E\\u127D \\u1218\\u1208\\u12AB\\u12CE\\u127D \\u1265\\u127B \\u1293\\u1278\\u12CD\\u1362 \\u12E8\\u1262\\u12DD\\u1290\\u1235 \\u1263\\u1208\\u1274\\u1276\\u127D \\u12A5\\u1293 \\u12A0\\u1235\\u1270\\u12F3\\u12F0\\u122A\\u12CE\\u127D \\u12E8\\u12F0\\u1295\\u1260\\u129E\\u127D \\u1320\\u1208\\u1275 \\u121B\\u1235\\u1308\\u1263\\u1275 \\u12A0\\u12ED\\u127D\\u1209\\u121D\\u1362")}', "Role restriction"],

  ['                  You cannot review your own business.',
   '                  {t("You cannot review your own business.", "\\u1260\\u122B\\u1235\\u12CE \\u1262\\u12DD\\u1290\\u1235 \\u120B\\u12ED \\u1320\\u1208\\u1275 \\u1218\\u133B\\u134D \\u12A0\\u12ED\\u127D\\u1209\\u121D\\u1362")}', "Own business restriction"],

  ['                    You have already reviewed this business.',
   '                    {t("You have already reviewed this business.", "\\u1260\\u12DA\\u1205 \\u1262\\u12DD\\u1290\\u1235 \\u120B\\u12ED \\u1320\\u1208\\u1275 \\u133D\\u1348\\u12CB\\u120D\\u1362")}', "Already reviewed"],

  ['{myReview.comment || "You left a rating without a comment."}',
   '{myReview.comment || t("You left a rating without a comment.", "\\u12A0\\u1235\\u1270\\u12AB\\u12A8\\u120D \\u1233\\u12ED\\u1328\\u121D\\u1229 \\u12CD\\u1324\\u1275 \\u1275\\u1265\\u1270\\u12CB\\u120D\\u1362")}', "Rating without comment"],

  ['                        Edit review',
   '                        {t("Edit review", "\\u1320\\u1208\\u1275 \\u12A0\\u1235\\u1270\\u12AB\\u12AD\\u120D")}', "Edit review"],

  ['                        Delete',
   '                        {t("Delete", "\\u1230\\u122D\\u12DD")}', "Delete review button"],

  ['                    How would you rate your experience?',
   '                    {t("How would you rate your experience?", "\\u12E8\\u12A5\\u1235\\u12AD\\u122D\\u1293 \\u1270\\u121E\\u12AD\\u122E\\u1295 \\u12A5\\u1295\\u12F4\\u1275 \\u12ED\\u1308\\u121D\\u1273\\u1209?")}', "Rating question"],

  ['accessibilityLabel={`${index + 1} star rating`}',
   'accessibilityLabel={t(`${index + 1} star rating`, `${index + 1} \\u12AE\\u12A8\\u1265 \\u12F0\\u1228\\u1303`) }', "Star accessibility label"],

  ['{reviewRating} out of 5 stars',
   '{t(`${reviewRating} out of 5 stars`, `5 \\u12AE\\u12A8\\u1266\\u127D \\u12CD\\u1235\\u1325 ${reviewRating} \\u12AE\\u12A8\\u1265`)}', "Rating summary"],

  ['placeholder="Tell others about your experience..."',
   'placeholder={t("Tell others about your experience...", "\\u12E8\\u12A5\\u1235\\u12AD\\u122D\\u1293 \\u1270\\u121E\\u12AD\\u122E\\u1295 \\u1208\\u122C\\u127D \\u12A0\\u130B\\u1229...")}', "Review placeholder"],

  ['{myReview ? "Update review" : "Submit review"}',
   '                           {myReview ? t("Update review", "\\u1320\\u1208\\u1275 \\u12A0\\u12D8\\u121D\\u1295") : t("Submit review", "\\u1320\\u1208\\u1275 \\u12A0\\u1235\\u1308\\u1263")}', "Review submit buttons"],

  ['                          Cancel',
   '                          {t("Cancel", "\\u1230\\u122D\\u12DD")}', "Cancel button"],

  ['{business.review_count} customer reviews',
   '{t(`${business.review_count} customer reviews`, `${business.review_count} \\u12E8\\u12F0\\u1295\\u1260\\u129E\\u127D \\u1320\\u1208\\u1276\\u127D`)}', "Review count"],

  ['                No written reviews yet. Be the first to share your experience.',
   '                {t("No written reviews yet. Be the first to share your experience.", "\\u12A5\\u1235\\u12AB\\u12F5 \\u12E8\\u1270\\u133B\\u1349 \\u1320\\u1208\\u1276\\u127D \\u12E8\\u1209\\u121D\\u1362 \\u1270\\u121E\\u12AD\\u122E\\u12CE\\u1295 \\u1260\\u1218\\u130B\\u122B\\u1275 \\u12E8\\u1218\\u1240\\u1218\\u1325 \\u12A5\\u1235\\u12AB\\u127D\\u1201 \\u12ED\\u1201\\u1291\\u1362")}.', "Empty reviews message"],

  ['{reviewer?.full_name || "YeneSpot customer"}',
   '{reviewer?.full_name || t("YeneSpot customer", "\\u12E8YeneSpot \\u12F0\\u1295\\u1260\\u129B")}', "Reviewer fallback"],

  ['{review.comment || "Customer left a rating."}',
   '{review.comment || t("Customer left a rating.", "\\u12F0\\u1295\\u1260\\u129B\\u12CD \\u12A0\\u1235\\u1270\\u12AB\\u12A8\\u120D \\u1275\\u1265\\u1270\\u12CB\\u120D\\u1362")}', "Review comment fallback"],

  ['                            Business owner response',
   '                            {t("Business owner response", "\\u12E8\\u1262\\u12DD\\u1290\\u1235 \\u1263\\u1208\\u1274\\u1273 \\u121D\\u120B\\u123D")}', "Owner response label"],

  ['              Discover local. Support local.',
   '              {t("Discover local. Support local.", "\\u12E8\\u12A0\\u12AB\\u1263\\u1262\\u12CE\\u1295 \\u1266\\u1273 \\u12ED\\u12C8\\u1241\\u1362 \\u12E8\\u12A0\\u12AB\\u1263\\u1262\\u12CE\\u1295 \\u12AD\\u1348\\u120D \\u12ED\\u1320\\u1241\\u1362")}', "Footer tagline"]
];

let updated = source;

for (const [original, replacement, label] of replacements) {
  updated = replaceExact(updated, original, replacement, label);
}

const backup = file + ".before-reviews-amharic";

if (fs.existsSync(backup)) {
  throw new Error("Backup already exists. No changes saved.");
}

fs.copyFileSync(file, backup);
fs.writeFileSync(file, updated, "utf8");

console.log("SUCCESS: Customer Reviews section translated.");
console.log("Replacements:", replacements.length);
console.log("Backup:", backup);
console.log("Existing line endings preserved.");
