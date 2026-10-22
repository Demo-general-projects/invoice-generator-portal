import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

// The app is served from the site root; Laravel hosts the static build in backend/public/app
// and its API under /api on the same domain.
const base: NextConfig = {
  trailingSlash: true, // /app/invoices/ -> invoices/index.html, which any web server can serve
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default function config(phase: string): NextConfig {
  if (phase === PHASE_DEVELOPMENT_SERVER) {
    // In development the Laravel API runs separately; forward /api/* to it so
    // the browser keeps calling its own origin, as it does in production.
    const apiUrl = process.env.API_URL ?? "http://localhost:8000";
    return {
      ...base,
      // Otherwise trailingSlash would first redirect /api/invoices to /api/invoices/.
      skipTrailingSlashRedirect: true,
      async rewrites() {
        return [{ source: "/api/:path*", destination: `${apiUrl}/api/:path*`, basePath: false }];
      },
    };
  }
  // `next build` writes plain HTML, CSS and JS to out/, ready for backend/public/app.
  return { ...base, output: "export" };
}
