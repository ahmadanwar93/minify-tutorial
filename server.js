const http = require("http");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const crypto = require("crypto");

const DIST = "dist";
const PORT = 3000;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

// Load every file in dist/ once, and precompress it
const files = {};
for (const name of fs.readdirSync(DIST)) {
  const raw = fs.readFileSync(path.join(DIST, name));
  files[`/${name}`] = {
    type: TYPES[path.extname(name)] || "application/octet-stream",
    raw,
    gzip: zlib.gzipSync(raw, { level: 9 }),
    br: zlib.brotliCompressSync(raw, {
      params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 },
    }),
    etag: `"${crypto.createHash("sha1").update(raw).digest("hex").slice(0, 16)}"`,
    hashed: /-[0-9a-f]{8}\.\w+$/.test(name),
  };
}
files["/"] = files["/index.html"];

http
  .createServer((req, res) => {
    const file = files[req.url.split("?")[0]];
    if (!file) {
      res.writeHead(404);
      return res.end("Not found");
    }

    const headers = { "Content-Type": file.type, Vary: "Accept-Encoding" };

    // 1. Caching policy
    if (file.hashed) {
      headers["Cache-Control"] = "public, max-age=31536000, immutable";
    } else {
      headers["Cache-Control"] = "no-cache";
      headers["ETag"] = file.etag;
      if (req.headers["if-none-match"] === file.etag) {
        res.writeHead(304, headers);
        return res.end();
      }
    }

    // 2. Compression, chosen from what the browser says it accepts
    const accept = req.headers["accept-encoding"] || "";
    let body = file.raw;
    if (accept.includes("br")) {
      body = file.br;
      headers["Content-Encoding"] = "br";
    } else if (accept.includes("gzip")) {
      body = file.gzip;
      headers["Content-Encoding"] = "gzip";
    }

    res.writeHead(200, headers);
    res.end(body);
  })
  .listen(PORT, () => console.log(`http://localhost:${PORT}`));
