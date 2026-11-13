# Frontend asset pipeline, by hand

A small static site pushed through a minify, bundle, hash and compress pipeline, then served with the right cache headers. It is a learning project: the goal is to see what tools like Vite do behind something like `@vite()`, not to replace them.

The input is deliberately awkward (a `calc()`, a `url()` with a space, a descendant selector, a string that looks like a comment, an unused JS export), so each step has something visible to prove.

## What it does

1. **Naive minifier** (`naive-minify.js`): three regexes, kept to show where regex breaks CSS.
2. **Real minify and bundle:** Lightning CSS for CSS, esbuild for JS. Imports are followed from one entry file, unused exports are dropped.
3. **Content hashing and a manifest** (`build.js`): each output is renamed `name-<8 hex of sha256>.ext`, `dist/manifest.json` maps logical to hashed names, and `dist/index.html` is generated from `src/index.html` with the hashed names.
4. **Compression check** (`compress.js`): prints raw, gzip and brotli sizes.
5. **Server** (`server.js`): serves `dist/` with cache headers and brotli or gzip.

## Requirements

Node.js (built and tested on Node 22) and npm.

## Run it

```bash
npm install
npm run build      # builds dist/ and prints the manifest
npm start          # serves dist/ on http://localhost:3000
```

Restart `npm start` after each build, because the server reads `dist/` once at startup.

Other commands:

```bash
node naive-minify.js src/base.css                 # see the regex minifier break things
node compress.js dist/app-*.css dist/app-*.js     # raw | gzip | brotli sizes
```

## Layout

```
src/
  index.html          template, references app.css and app.js
  base.css            CSS entry point (@imports layout.css and theme.css)
  layout.css
  theme.css
  main.js             JS entry point
  utils.js            one used export, one unused
build.js              build + hash + manifest + HTML templating
compress.js           size comparison
naive-minify.js       the regex minifier (a cautionary example)
server.js             static server with cache headers
dist/                 generated output (gitignored)
```

## Results

| Step | Before | After |
|---|---|---|
| CSS, bundle + minify | 494 B | 252 B |
| JS, bundle + minify | 312 B | 107 B |
| Larger JS file, minify + brotli | 97,463 B | 14,515 B |

On the larger file, minifying alone saved about 46%, but only about 23% once gzip was applied, because compression already removes much of what minifying removes. Brotli was about 12% smaller than gzip on the minified file. On tiny files compression can lose: gzip made the 107 B JS file 118 B.

Changing one CSS rule changed only the CSS hash, and changing one JS line changed only the JS hash. Reverting the edits gave back the original hashes.

## Cache policy in `server.js`

| File | `Cache-Control` | Why |
|---|---|---|
| `app-<hash>.css`, `app-<hash>.js` | `public, max-age=31536000, immutable` | the name changes when the content changes |
| `index.html`, `manifest.json` | `no-cache` + `ETag` | the name never changes, so it is revalidated (`304` if unchanged) |

Every response also carries `Vary: Accept-Encoding`. In the browser, a normal reload shows `index.html` as a `304` and the hashed files served from cache with no request.

## Known simplifications

- The server loads and precompresses files once at startup.
- It uses one `ETag` for all encodings, where real servers use one per encoding.
- The `404` for `a b.png` in DevTools is expected: the test CSS references an image that does not exist.
- Not production code. For a real project use Vite (or similar) and a real web server or CDN.

## Docs

- [esbuild](https://esbuild.github.io/api/) and [Lightning CSS](https://lightningcss.dev/)
- [Vite backend integration](https://vite.dev/guide/backend-integration) (the manifest format)
- MDN: [HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching), [Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control), [Vary](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Vary), [Content-Encoding](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Encoding)
