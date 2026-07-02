/**
 * MindineersOS — Application Configuration
 *
 * Single source of truth for app identity. Used by:
 * - capacitor.config.ts (mobile builds)
 * - main.tsx (React boot)
 * - run-mobile-build.mjs (native overlay — reads appId/appName via regex)
 * - Electrobun desktop shell (via ELIZA_APP_NAME / ELIZA_APP_ID env vars)
 *
 * Built by Kartikay Srivastava at Mindineers Labs.
 */
import type { AppConfig } from "@elizaos/app-core";

interface AppWebConfig {
  shortName: string;
  themeColor: string;
  backgroundColor: string;
  shareImagePath: string;
}

const config = {
  appName: "MindineersOS",
  appId: "com.mindineers.os",
  orgName: "Mindineers Labs",
  repoName: "mindineeros",
  cliName: "mindineers",
  description:
    "MindineersOS — The Sovereign AI Agent Operating System by Mindineers Labs",
  envPrefix: "ELIZA",
  namespace: "eliza",
  defaultApps: ["@elizaos/plugin-lifeops"],

  desktop: {
    bundleId: "com.mindineers.os",
    urlScheme: "mindineers",
  },

  web: {
    shortName: "MindineersOS",
    themeColor: "#FF5800",
    backgroundColor: "#0A0B0F",
    shareImagePath: "/og-image.png",
  },

  branding: {
    appName: "MindineersOS",
    orgName: "Mindineers Labs",
    repoName: "mindineeros",
    docsUrl: "https://mindineers.dev",
    appUrl: "https://mindineers.dev",
    bugReportUrl: "https://mindineers.dev/issues",
    hashtag: "#MindineersOS",
    fileExtension: ".mindineers",
    packageScope: "elizaos",
  },
} satisfies AppConfig & { web: AppWebConfig };

export default config;
