import type { MetadataRoute } from "next";
import { site } from "@/content/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.nameDisplay} - Portfolio`,
    short_name: site.name,
    description:
      "Portfolio d'Alexandre Boissel, développeur full-stack.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f8fb",
    theme_color: "#3b6cf5",
    lang: "fr",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
