import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js blocks cross-origin requests to the dev server by default; this
  // lets you open the dev server from a phone on the same LAN (via the
  // computer's IP) to test on a real device. Update this if your computer's
  // LAN IP changes.
  allowedDevOrigins: ["192.168.1.253"],
};

export default nextConfig;
