import type { NextConfig } from "next";

const githubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  // The dev server listens on 0.0.0.0, so browsers that open 127.0.0.1
  // are treated as a different host. Without this, the HMR socket is
  // rejected and the page never hydrates.
  allowedDevOrigins: ["127.0.0.1"],
  ...(githubPages
    ? {
        output: "export" as const,
        images: { unoptimized: true },
        trailingSlash: true,
        basePath: "/seojae",
        assetPrefix: "/seojae",
      }
    : {
        cacheComponents: true,
        partialPrefetching: true,
      }),
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
