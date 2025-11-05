import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Using js-tiktoken (pure JavaScript) instead of tiktoken (WASM)
  // No special webpack/turbopack configuration needed for pure JS libraries
};

export default nextConfig;
