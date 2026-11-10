import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Loop",
    short_name: "Loop",
    description: "The free professional network for people who build.",
    start_url: "/feed",
    display: "standalone",
    background_color: "#F6F5F0",
    theme_color: "#F6F5F0",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
