# Client Script Injection in Workers: Troubleshooting and Fix

Date: 2025-08-26

## Summary

- __Problem__: Dev build failed with esbuild syntax errors inside injected
  client scripts for `how-to-implement` and `how-to-apply-cc` modules.
- __Root cause__: Injected script was wrapped with a single block comment
  `/* ... */`. Third‑party bundled code contained internal `*/`, which
  prematurely terminated the comment and exposed raw JSON/JS to the parser.
- __Fix__: Replace block comment wrapping with per‑line `//` comments for the
  entire injected script. This guarantees no accidental un‑commenting.
- __Result__: `npm run build:client` and `npm run dev` start cleanly; Wrangler
  serves the Worker without syntax errors.

## Affected files

- `scripts/build-client.js`
- `modules/how-to-implement/index.ts`
- `modules/how-to-apply-cc/index.ts`

## Symptoms

- esbuild reported parse errors at lines resembling JSON entries (e.g.
  `"version": "2.3.1",`) inside the injected block.
- Errors pointed into large injected regions of the module files where the
  client bundle had been inserted.

## Root cause analysis

- The injection strategy wrapped the entire client bundle with `/* ... */`.
- Bundled dependencies (e.g., markdown-it, punycode, or their transitive
  deps) include sequences like `*/` in JSDoc or multi-line comments.
- Those internal `*/` sequences closed the outer block comment early.
- Remaining content after premature closure was parsed as JS/JSON → syntax
  errors during Worker bundling.

## The fix

- Use per-line comments for the injected script to prevent termination by
  internal tokens:
  - Each line of the injected content is prefixed with `// `.
  - Clear markers are added to aid maintenance and auto-reset:
    - `// BEGIN_INERT_CLIENT_SCRIPT (...)`
    - `// END_INERT_CLIENT_SCRIPT (...)`

### Implementation details

- In `scripts/build-client.js`:
  - `injectHowToImplementScript()` and `injectHowToApplyCCScript()` now build
    `wrappedScript` like this:

```js
const wrappedScript = [
  '// BEGIN_INERT_CLIENT_SCRIPT (How to Implement)',
  ...scriptContent.split('\n').map((line) => `// ${line}`),
  '// END_INERT_CLIENT_SCRIPT (How to Implement)'
].join('\n');
```

- Auto-reset logic remains intact so the module files are returned to a known
  clean template before re-injection.

## Verification steps

1. Build client bundles and re-inject:

```bash
npm run build:client
```

Expected logs (abridged):

- 打包模块输出到 `shared/scripts/generated/*.ts`
- 已重置模块为干净模板
- 脚本注入完成

2. Start dev server:

```bash
npm run dev
```

Expected:

- Wrangler reports Ready, e.g. `Ready on http://localhost:xxxxx`
- No esbuild syntax errors during startup or subsequent rebuilds

3. Open the app in the browser and confirm pages that include:

- `modules/how-to-implement/index.ts`
- `modules/how-to-apply-cc/index.ts`

render without Worker-side errors.

## Safety and guardrails

- __Inert in Worker__: Since each injected line is commented, no browser-only
  code runs in the Cloudflare Worker.
- __Client runtime__: If browser execution is required, initialize from the
  generated bundles in `shared/scripts/generated/` on the client side, not
  from the Worker-rendered TS modules.
- __DOM isolation__: Ensure Worker code paths never import or execute DOM
  APIs. Keep Markdown/DOM renderers isolated to client-only code.

## Alternatives considered

- Escaping interior `*/` in the bundle: brittle and error-prone.
- Nested/changed block comment markers: still susceptible to collisions.
- Base64-encoding within a block comment: increases size, adds decoding
  complexity, and still risks comment collisions around the wrapper.

Per-line comments provide the simplest, robust, and readable solution.

## Quick checklist

- __Injection uses line comments__ in `scripts/build-client.js`.
- __Modules reset__ to a clean template before injection.
- __No DOM usage__ in Worker code paths.
- __Build OK__: `npm run build:client`.
- __Dev OK__: `npm run dev` → Wrangler Ready.

## References

- Build script: `scripts/build-client.js`
- Modules: `modules/how-to-implement/index.ts`,
  `modules/how-to-apply-cc/index.ts`
- Generated bundles: `shared/scripts/generated/`
