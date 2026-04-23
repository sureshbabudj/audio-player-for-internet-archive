import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const base = env.PWA_BASE_PATH || "/";

  return {
    base,
    plugins: [react()],
    build: {
      outDir: "dist-pwa",
      emptyOutDir: true,
    },
    server: {
      port: 5174,
    },
  };
});
