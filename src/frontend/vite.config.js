import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Proxy for file-service (bypass CORS)
      "/api/file-upload": {
        target: "https://file-service-cdal.onrender.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/file-upload/, "/api/v1/file/uploads"),
        secure: true,
      },
      "/api/v1/comments": {
        target: "http://localhost:8003",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v1/, ""),
      },
      "/api/v1": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
