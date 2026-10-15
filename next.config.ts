import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev server listens on 0.0.0.0, so browsers that open 127.0.0.1
  // are treated as a different host. Without this, the HMR socket is
  // rejected and the page never hydrates.
  allowedDevOrigins: ["127.0.0.1"],
  cacheComponents: true,
  partialPrefetching: true,
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
