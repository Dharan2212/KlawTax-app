import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 8080,
    proxy: {
      "/api": {
        target: process.env.BACKEND_URL || "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    // Raise warning threshold — CRM bundle is intentionally large
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React core
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
            return "react";
          }
          // Router
          if (id.includes("node_modules/react-router") || id.includes("node_modules/@remix-run")) {
            return "router";
          }
          // Animation
          if (id.includes("node_modules/framer-motion")) {
            return "motion";
          }
          // Radix UI / shadcn (shared UI primitives)
          if (id.includes("node_modules/@radix-ui")) {
            return "radix";
          }
          // State / query
          if (id.includes("node_modules/@tanstack") || id.includes("node_modules/zustand")) {
            return "state";
          }
          // CRM pages & components — lazy loaded, separate chunk
          if (
            id.includes("/src/app/crm/") ||
            id.includes("/src/components/crm/") ||
            id.includes("/src/pages/crm/")
          ) {
            return "crm";
          }
          // Lucide icons (large, shared)
          if (id.includes("node_modules/lucide-react")) {
            return "icons";
          }
        },
      },
    },
  },
});
