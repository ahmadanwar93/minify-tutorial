const fs = require("fs");

const css = fs.readFileSync(process.argv[2], "utf8");

const out = css
  .replace(/\/\*[\s\S]*?\*\//g, "") // 1. strip /* comments */
  .replace(/\s+/g, " ") // 2. collapse whitespace runs to one space
  .replace(/\s*([{}:;,+])\s*/g, "$1") // 3. trim spaces around punctuation
  .trim();

console.log(out);
