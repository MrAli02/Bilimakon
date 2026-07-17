import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BilimMakon",
    short_name: "BilimMakon",
    description: "O'zbekiston o'qituvchilari uchun attestatsiya platformasi",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#3366ff",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
