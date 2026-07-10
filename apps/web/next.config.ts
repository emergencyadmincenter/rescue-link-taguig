import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["shared-schemas"],
  experimental: {
    externalDir: true,
  },
};

export default nextConfig;
