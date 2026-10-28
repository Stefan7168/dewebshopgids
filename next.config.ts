import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Pages for slugs unknown at build serve the shell, then cache the URL-specific render (ISR).
  partialPrefetching: true,
};

export default nextConfig;
