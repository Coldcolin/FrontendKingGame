// Copies the Tailwind browser runtime and html-to-image into public/sandbox so
// the opaque-origin preview frame can load them without a CDN.
import { createRequire } from "node:module";
import { copyFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const out = path.resolve(import.meta.dirname, "../public/sandbox");
mkdirSync(out, { recursive: true });
copyFileSync(require.resolve("@tailwindcss/browser"), path.join(out, "tailwind.js"));
copyFileSync(path.join(path.dirname(require.resolve("html-to-image/package.json")), "dist/html-to-image.js"), path.join(out, "html-to-image.js"));
console.log("[sandbox] runtime copied to public/sandbox");
