import type { NextConfig } from "next";

const githubPages = process.env.GITHUB_PAGES === "true";
const capacitor = process.env.CAPACITOR === "true";
const staticExport = githubPages || capacitor;

const nextConfig: NextConfig = {
  // The dev server listens on 0.0.0.0, so browsers that open 127.0.0.1
  // are treated as a different host. Without this, the HMR socket is
  // rejected and the page never hydrates.
  allowedDevOrigins: ["127.0.0.1"],
  serverExternalPackages: [
    "@capacitor/app",
    "@capacitor/core",
    "@capacitor/filesystem",
    "@capacitor/keyboard",
    "@capacitor/share",
    "@capacitor/splash-screen",
    "@capacitor/status-bar",
  ],
  ...(staticExport
    ? {
        output: "export" as const,
        images: { unoptimized: true },
        trailingSlash: true,
        ...(githubPages
          ? {
              basePath: "/seojae",
              assetPrefix: "/seojae",
            }
          : {}),
      }
    : {}),
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
