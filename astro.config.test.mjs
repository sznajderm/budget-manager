// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";

// Test configuration using Node adapter (supports preview mode)
// https://astro.build/config
export default defineConfig({
  output: "server",
  image: {
    service: {
      entrypoint: "astro/assets/services/sharp",
      config: {
        limitInputPixels: false,
      },
    },
  },
  integrations: [react(), sitemap()],
  server: { port: 3010 },
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: ["sharp"],
    },
  },
  adapter: node({ mode: "standalone" }),
});
