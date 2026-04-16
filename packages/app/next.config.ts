import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@demo/ui"],
  serverExternalPackages: ["pg"],
};

export default nextConfig;
