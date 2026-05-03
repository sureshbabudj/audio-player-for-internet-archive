import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import webExtension, { readJsonFile } from "vite-plugin-web-extension";

function generateManifest() {
  const manifest = readJsonFile("src/manifest.json");
  const pkg = readJsonFile("package.json");

  return {
    name: pkg.name,
    description: pkg.description,
    version: pkg.version,
    ...manifest,
  };
}

export default defineConfig({
  plugins: [
    react(),
    webExtension({
      manifest: generateManifest,
      // Auto-detects browser from manifest templates
      additionalInputs: ["src/background.ts", "src/offscreen.html"],
      watchFilePaths: ["src/**/*.ts", "src/**/*.tsx", "src/**/*.css", "src/**/*.html"],
    }),
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
