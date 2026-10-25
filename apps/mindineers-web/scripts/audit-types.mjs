import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, relative } from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const typed = [],
  legacy = [],
  facades = [],
  generated = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (/\.[jt]sx?$/.test(path)) {
      const name = relative(root, path),
        text = await readFile(path, "utf8");
      if (/\.tsx?$/.test(path)) typed.push(name);
      else if (name.startsWith("src/generated/")) generated.push(name);
      else if (/^(?:export\s+(?:\*|\{[^}]*\})\s+from\s+["'][^"']+["'];?\s*)+$/.test(text.replace(/^\s*\/\/.*$/gm, "").trim()))
        facades.push(name);
      else legacy.push({ path: name, lines: text.split("\n").length });
    }
  }
}
await walk(join(root, "src"));
const report = {
  strictTypeScriptFiles: typed.sort(),
  compatibilityFacades: facades.sort(),
  generatedJavaScript: generated.sort(),
  uncheckedJavaScript: legacy.sort((a, b) => a.path.localeCompare(b.path)),
  note: "Source inventory, not type coverage by behavior. checkJs is false; legacy files require further migration/review.",
};
await mkdir(join(root, "reports"), { recursive: true });
await writeFile(
  join(root, "reports/type-boundary.json"),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  `${typed.length} strict TS/TSX files; ${facades.length} compatibility facades; ${legacy.length} unchecked JS files. See reports/type-boundary.json.`,
);
if (process.argv.includes("--require-complete") && legacy.length)
  process.exitCode = 1;
