import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js blocks cross-origin requests to the dev server by default; this
  // lets you open the dev server from a phone on the same LAN (via the
  // computer's IP) to test on a real device. Update this if your computer's
  // LAN IP changes.
  allowedDevOrigins: ["192.168.1.253"],
  experimental: {
    // Every page here is dynamic (per-user Supabase data via cookies), so
    // Next.js's default (0s) refetches from scratch on every single tab
    // switch — even flipping right back to a tab you just left. Reusing the
    // last render for a short window makes bottom-nav navigation feel
    // instant; router.refresh() after mutations still bypasses this for the
    // page you just edited.
    staleTimes: {
      dynamic: 30,
    },
  },
};

export default nextConfig;
