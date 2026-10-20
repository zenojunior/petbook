import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Self-contained server in .next/standalone, used by the Docker image.
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          // The share link keeps its secret in the URL (/s/<token>), so it must not leak to other sites.
          { key: "Referrer-Policy", value: "same-origin" },
          // Nobody needs to embed Petbook in a frame; this also blocks clickjacking.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
