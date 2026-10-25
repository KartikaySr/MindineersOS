import { readFile, writeFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const manifest = JSON.parse(
  await readFile(join(root, "dist/.vite/manifest.json"), "utf8"),
);
const entry = Object.keys(manifest).find((key) => manifest[key].isEntry);
if (!entry) throw new Error("Build manifest has no entry.");
const initial = new Set();
function visit(key) {
  const chunk = manifest[key];
  if (!chunk || initial.has(chunk.file)) return;
  initial.add(chunk.file);
  (chunk.imports || []).forEach(visit);
}
visit(entry);
let initialGzip = 0;
const assets = [];
for (const filename of (await readdir(join(root, "dist/assets"))).sort()) {
  const path = `assets/${filename}`,
    data = await readFile(join(root, "dist", path));
  const gzip = gzipSync(data).length;
  if (initial.has(path)) initialGzip += gzip;
  if (filename.endsWith(".js") && gzip > 180_000)
    throw new Error(`Chunk exceeds 180 kB gzip budget: ${filename}`);
  assets.push({
    path,
    bytes: data.length,
    gzip,
    sha256: createHash("sha256").update(data).digest("hex"),
  });
}
if (initialGzip > 160_000)
  throw new Error(`Initial JS exceeds 160 kB gzip budget: ${initialGzip}`);
if ([...initial].some((path) => path.includes("Office-")))
  throw new Error("3D office must stay optional.");
const config = JSON.parse(await readFile(join(root, "vercel.json"), "utf8"));
let repositoryConfig;
try {
  repositoryConfig = JSON.parse(
    await readFile(join(root, "../../vercel.json"), "utf8"),
  );
} catch (error) {
  // A standalone app checkout has no enclosing repository deployment config.
  if (error.code !== "ENOENT") throw error;
}
if (
  repositoryConfig &&
  JSON.stringify(config.headers) !== JSON.stringify(repositoryConfig.headers)
)
  throw new Error("Deployment header configurations differ.");
const headers = Object.fromEntries(
  config.headers[0].headers.map((h) => [h.key.toLowerCase(), h.value]),
);
for (const directive of [
  "script-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
])
  if (!headers["content-security-policy"].includes(directive))
    throw new Error(`Missing CSP: ${directive}`);
if (headers["content-security-policy"].includes("'unsafe-eval'"))
  throw new Error("CSP permits eval.");
const report = {
  schema: 1,
  node: process.version,
  initialJavaScriptGzipBytes: initialGzip,
  assetDigest: createHash("sha256")
    .update(JSON.stringify(assets))
    .digest("hex"),
  assets,
};
await writeFile(
  join(root, "dist/release.json"),
  JSON.stringify(report, null, 2),
);
console.log(
  `Release asset gate passed: initial JS ${(initialGzip / 1000).toFixed(1)} kB gzip; ${assets.length} hashed assets. Deployment headers match.`,
);
