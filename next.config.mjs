import { existsSync } from "node:fs";

// The kiosk attract video turns itself on when the file is present at build time.
const attract = ["mp4", "webm"].some((x) => existsSync(`public/media/mirror/attract-loop.${x}`));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_ATTRACT_VIDEO: process.env.NEXT_PUBLIC_ATTRACT_VIDEO || (attract ? "1" : "0") },
};
export default nextConfig;
