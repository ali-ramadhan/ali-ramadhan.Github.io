import { defineConfig } from "vite";
import legacy from "@vitejs/plugin-legacy";

export default defineConfig({
  plugins: [
    legacy({
      targets: ["defaults", "not IE 11"],
    }),
  ],
  // Set public directory for static assets that should be copied as-is
  publicDir: "public",
  // Handle static assets
  assetsInclude: ["**/*.webm", "**/*.png", "**/*.jpg", "**/*.svg", "**/*.woff2", "**/*.json", "**/*.mp4"],
});
