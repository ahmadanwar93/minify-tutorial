const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");

const DIST = "dist";

// 1. Start clean, then build
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST);
execSync("npx lightningcss --minify --bundle src/base.css -o dist/app.css", {
  stdio: "inherit",
});
execSync("npx esbuild src/main.js --bundle --minify --outfile=dist/app.js", {
  stdio: "inherit",
});

// 2. Hash each file's final content and rename it
const manifest = {};
for (const file of ["app.css", "app.js"]) {
  const filePath = path.join(DIST, file);
  const content = fs.readFileSync(filePath);
  const hash = crypto
    .createHash("sha256")
    .update(content)
    .digest("hex")
    .slice(0, 8);
  const { name, ext } = path.parse(file);
  const hashed = `${name}-${hash}${ext}`;
  fs.renameSync(filePath, path.join(DIST, hashed));
  manifest[file] = hashed;
}

// 3. Write the manifest: logical name -> hashed name
fs.writeFileSync(
  path.join(DIST, "manifest.json"),
  JSON.stringify(manifest, null, 2),
);

// 4. Template index.html with the hashed names
let html = fs.readFileSync("src/index.html", "utf8");
for (const [logical, hashed] of Object.entries(manifest)) {
  html = html.replaceAll(`"${logical}"`, `"${hashed}"`);
}
fs.writeFileSync(path.join(DIST, "index.html"), html);

console.log(manifest);
