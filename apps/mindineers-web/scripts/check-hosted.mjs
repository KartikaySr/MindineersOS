import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const origin = new URL(process.argv[2] || "https://www.mindineers.com");
if (origin.protocol !== "https:" || origin.username || origin.password)
  throw new Error("Use a public HTTPS site without credentials.");
async function get(path) {
  const response = await fetch(new URL(path, origin), {
    signal: AbortSignal.timeout(20000),
    redirect: "error",
  });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response;
}
const response = await get("/");
for (const [key, value] of [
  ["x-content-type-options", "nosniff"],
  ["x-frame-options", "DENY"],
])
  if (response.headers.get(key) !== value)
    throw new Error(`Missing security header: ${key}`);
const expected = JSON.parse(
  await readFile(new URL("../vercel.json", import.meta.url), "utf8"),
).headers[0].headers;
for (const { key, value } of expected)
  if (response.headers.get(key) !== value)
    throw new Error(`Deployment header mismatch: ${key}`);
const html = await response.text();
if (!html.includes('id="root"')) throw new Error("Application root missing.");
const paths = [...html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g)].map(
  (match) => match[1],
);
if (!paths.some((path) => path.endsWith(".js")))
  throw new Error("Entry script missing.");
for (const path of paths) {
  const asset = await get(path);
  const bytes = Buffer.from(await asset.arrayBuffer());
  if (!bytes.length) throw new Error(`Empty asset: ${path}`);
  console.log(
    `${path}: ${bytes.length} bytes; sha256 ${createHash("sha256").update(bytes).digest("hex")}`,
  );
}
console.log(
  "Hosted HTML, referenced assets and security headers passed. This is not an interactive browser check.",
);
if (process.argv.includes("--match-local")) {
  const local = JSON.parse(
    await readFile(new URL("../dist/release.json", import.meta.url), "utf8"),
  );
  const deployed = await (await get("/release.json")).json();
  if (local.assetDigest !== deployed.assetDigest)
    throw new Error("Hosted build differs from the locally verified release.");
  for (const asset of local.assets) {
    const bytes = Buffer.from(
      await (await get("/" + asset.path)).arrayBuffer(),
    );
    if (createHash("sha256").update(bytes).digest("hex") !== asset.sha256)
      throw new Error(`Hosted content mismatch: ${asset.path}`);
  }
  console.log("Every hosted asset matches the local verified build.");
}
