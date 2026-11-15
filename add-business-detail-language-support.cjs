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

let updated = source;

const importAnchor = 'import { supabase } from "../../lib/supabase";';

updated = replaceExact(
  updated,
  importAnchor,
  importAnchor + nl + 'import { useAppLanguage } from "../../context/LanguageContext";',
  "Language provider import"
);

const days = [
  "const DAYS = [",
  '  "Sunday",',
  '  "Monday",',
  '  "Tuesday",',
  '  "Wednesday",',
  '  "Thursday",',
  '  "Friday",',
  '  "Saturday",',
  "];"
].join(nl);

const daysAm = [
  "const DAYS_AM = [",
  '  "\\u12A5\\u1211\\u12F5",',
  '  "\\u1230\\u129E",',
  '  "\\u121B\\u1295\\u1233\\u12AD\\u1235",',
  '  "\\u1228\\u1265\\u12D5",',
  '  "\\u1210\\u1219\\u1235",',
  '  "\\u12D3\\u122D\\u1265",',
  '  "\\u1245\\u12B3\\u12DC",',
  "];"
].join(nl);

updated = replaceExact(
  updated,
  days,
  days + nl + nl + daysAm,
  "Weekday array"
);

const componentAnchor =
  '  const { slug } = useLocalSearchParams<{ slug: string }>();';

const languageHook = [
  componentAnchor,
  '  const { language } = useAppLanguage();',
  '  const isAmharic = language === "am";',
  '  const t = (english: string, amharic: string) =>',
  '    isAmharic ? amharic : english;'
].join(nl);

updated = replaceExact(
  updated,
  componentAnchor,
  languageHook,
  "Language hook"
);

const backup = file + ".before-amharic-foundation-edit";

if (fs.existsSync(backup)) {
  throw new Error("Safety backup already exists. No changes saved.");
}

fs.copyFileSync(file, backup);
fs.writeFileSync(file, updated, "utf8");

console.log("SUCCESS: Language foundation added.");
console.log("Backup:", backup);
console.log("Language provider import: added.");
console.log("Amharic weekdays: added.");
console.log("Language hook: added.");
console.log("Original CRLF line endings preserved.");
