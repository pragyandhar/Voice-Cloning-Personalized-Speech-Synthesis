import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: ["f2d26f96a868.ngrok-free.app"],
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["@splinetool/react-spline", "@splinetool/runtime"],
    force: true,
  },
  build: {
    outDir: "dist",
    commonjsOptions: { include: [/node_modules/] },
    rollupOptions: {
      external: [],
      output: {
        manualChunks: undefined,
      },
    },
  },
});
