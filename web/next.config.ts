import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["shiki", "mermaid"],
  // Disable auto-generating AI agent rule files
  agentRules: false,
  // Smooth scroll requires data attribute for route transitions
  experimental: {
    scrollRestoration: true,
  },
};

export default nextConfig;