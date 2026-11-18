import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
const config = JSON.parse(
  readFileSync(new URL("./vercel.json", import.meta.url), "utf8"),
);
// Opt-in loopback API forwarding for the existing app-core host.
const backend = process.env.MINDINEERS_API_TARGET;
let proxy;
if (backend) {
  const target = new URL(backend);
  if (
    !["http:", "https:"].includes(target.protocol) ||
    !["127.0.0.1", "localhost", "[::1]"].includes(target.hostname) ||
    target.username ||
    target.password ||
    target.pathname !== "/" ||
    target.search ||
    target.hash
  ) {
    throw new Error("MINDINEERS_API_TARGET must be a loopback HTTP(S) origin.");
  }
  proxy = Object.fromEntries(
    ["/api/auth", "/api/mindineers"].map((path) => [
      path,
      { target: target.origin, changeOrigin: true },
    ]),
  );
}
export default defineConfig({
  server: { proxy },
  build: { manifest: true },
  preview: {
    proxy,
    headers: Object.fromEntries(
      config.headers[0].headers.map((h) => [h.key, h.value]),
    ),
  },
});
