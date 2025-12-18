import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: [
      ".ngrok-free.dev",
      ".ngrok.io",
      "3.26.198.240:",
      "https://tashia-rude-subcortically.ngrok-free.dev",
    ],
    host: true,
    proxy: {
      "/api/file-upload": {
        target: "https://file-service-cdal.onrender.com",
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(/^\/api\/file-upload/, "/api/v1/file/uploads"),
        secure: true,
      },
      "/socket.io": {
        target: "http://localhost:8899",
        changeOrigin: true,
        ws: true,
        secure: false,
        // Gracefully handle backend offline
        configure: (proxy, options) => {
          proxy.on("error", (err, req, res) => {
            console.log("Socket proxy error (backend may be offline)");
          });
        },
      },
      "/api/v1/identity": {
        target: "http://localhost:8888",
        changeOrigin: true,
        secure: false,
      },
      "/api/v1/comments": {
        target: "http://localhost:8003",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v1/, ""),
      },
      "/api/v1": {
        target: "http://localhost:8888",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
