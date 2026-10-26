import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// The FastAPI service. Port 8000 is used by other local projects, so the API has its own
// port; keep in step with scripts/backend.mjs.
const apiTarget = `http://127.0.0.1:${process.env.API_PORT || "8010"}`;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    // Listen on this machine only. Set VITE_DEV_HOST=0.0.0.0 to reach the dev
    // server from another device on a trusted network.
    host: process.env.VITE_DEV_HOST || "localhost",
    port: 8080,
    fs: {
      // The project root also holds the backend, its database, datasets and .git.
      // Serve only what the frontend needs; everything else answers 403.
      strict: true,
      allow: ["src", "public", "node_modules", "index.html"].map((entry) =>
        path.resolve(__dirname, entry),
      ),
      deny: [".env", ".env.*", "*.{crt,pem,key}", "**/.git/**", "*.db", "*.sql"],
    },
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": {
        target: apiTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
        configure: (proxy) => {
          // Without this, a stopped API surfaces in the browser as a bare "HTTP 500".
          proxy.on("error", (_error, _request, response) => {
            if (!("writeHead" in response) || response.headersSent) return;
            response.writeHead(503, { "Content-Type": "application/json" });
            response.end(JSON.stringify({
              detail: `The Tele-Triage API is not running at ${apiTarget}. Start it with "npm run dev:api".`,
            }));
          });
        },
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
