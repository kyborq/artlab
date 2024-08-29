import path from "path";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";

import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [react(), svgr()],
  base: "",
  server: {
    port: 4173,
    host: "0.0.0.0",
  },
});
