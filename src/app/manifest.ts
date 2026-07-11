import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Couply — Quản lý chi tiêu cho các cặp đôi",
    short_name: "Couply",
    description: "Quản lý chi tiêu cùng người ấy",
    start_url: "/",
    display: "standalone",
    background_color: "#f3faf8",
    theme_color: "#1868db",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
