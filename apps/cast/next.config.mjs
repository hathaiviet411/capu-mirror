/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.js");

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: ["localhost", "lh3.googleusercontent.com", "cdn.discordapp.com"],
  },
  experimental: {
    typedRoutes: true,
  },
  // Enable standalone mode for Docker
  output: "standalone",
}

export default nextConfig
