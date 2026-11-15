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
    '<Text style={styles.sectionTitle}>Services & offerings</Text>',
    '<Text style={styles.sectionTitle}>{t("Services & offerings", "\\u12E8\\u12E0\\u1308\\u120D\\u130D\\u120E\\u1275 \\u12A5\\u1293 \\u12E8\\u121A\\u1270\\u12EB\\u12E9 \\u12A0\\u1308\\u120D\\u130D\\u120E\\u1276\\u127D")}</Text>',
    "Services heading"
  ],
  [
    '                  No services have been listed yet.',
    '                  {t("No services have been listed yet.", "\\u12A5\\u1235\\u12AB\\u12F5 \\u12E8\\u12A0\\u1308\\u120D\\u130D\\u120E\\u1275 \\u12DD\\u122D\\u12DD\\u122D \\u12A0\\u120D\\u1270\\u12F0\\u1228\\u1308\\u121D\\u1362")}',
    "Empty services message"
  ],
  [
    '? "Ask"',
    '? t("Ask", "\\u12CB\\u130B\\u12CD\\u1295 \\u12ED\\u1320\\u12ED\\u1241")',
    "Ask price label"
  ]
];

let updated = source;

for (const [original, replacement, label] of replacements) {
  updated = replaceExact(updated, original, replacement, label);
}

const backup = file + ".before-services-amharic";

if (fs.existsSync(backup)) {
  throw new Error("Backup already exists. No changes saved.");
}

fs.copyFileSync(file, backup);
fs.writeFileSync(file, updated, "utf8");

console.log("SUCCESS: Services section translated.");
console.log("Replacements:", replacements.length);
console.log("Backup:", backup);
console.log("Original line endings preserved.");
