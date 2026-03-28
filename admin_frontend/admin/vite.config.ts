import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/xpanel-a7k2/",
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      "/v1": {
        target: process.env.VITE_BACKEND_URL || "http://localhost:3001",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
