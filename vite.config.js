import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/ustime/",
  build: {
    outDir: "dist",
    assetsDir: "assets",
  },
  plugins: [tailwindcss()],
});
