import type { NextConfig } from "next";
import { getSecurityHeaders } from "./lib/security/headers";

const nextConfig: NextConfig = {
  // Security headers applied to all routes
  async headers() {
    const isDevelopment = process.env.NODE_ENV === "development";

    return [
      {
        // Apply to all routes
        source: "/:path*",
        headers: getSecurityHeaders(isDevelopment),
      },
    ];
  },
};

export default nextConfig;
