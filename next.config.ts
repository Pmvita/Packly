import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["cap", "pino", "thread-stream"],
};

export default nextConfig;
