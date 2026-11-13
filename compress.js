const fs = require("fs");
const zlib = require("zlib");

console.log("file | raw | gzip | brotli");

for (const file of process.argv.slice(2)) {
  const raw = fs.readFileSync(file);

  // level 9 is max gzip level
  const gz = zlib.gzipSync(raw, { level: 9 });
  // level 11 is brotli at max level
  const br = zlib.brotliCompressSync(raw, {
    params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 },
  });

  console.log(`${file} | ${raw.length} | ${gz.length} | ${br.length}`);
}
