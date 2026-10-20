import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page reads per-request invoice data, so Cache Components/PPR add nothing here.
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
