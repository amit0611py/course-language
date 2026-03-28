import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy /v1/* → Fastify backend (default port 3001)
      // To override: set VITE_BACKEND_URL=http://localhost:<port> in .env
      "/v1": {
        target: process.env.VITE_BACKEND_URL || "http://localhost:3001",
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on("error", (err) => {
            console.error(
              "\n[vite proxy] ❌ Cannot reach backend at http://localhost:3001\n" +
              "  → Make sure the Fastify server is running: cd ../lang && npm run dev\n",
              err.message
            );
          });
        },
      },
      "/icons": {
        target: process.env.VITE_BACKEND_URL || "http://localhost:3001",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
