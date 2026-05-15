import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    outputFileTracingIncludes: {
      "/api/docs": ["app/api/**"],
    },
  } as NextConfig["experimental"],
};

export default nextConfig;
