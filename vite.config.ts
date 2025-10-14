import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8005,
    fs: {
      allow: ["./client", "./shared", "./node_modules", "."],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
    proxy: {
      // ORINAI CHAT PORT 8080
      '/agents': {
        target: 'http://216.244.94.213:8080',
        changeOrigin: true,
        secure: false,
      },
      '/whatsapp/number': {
        target: 'http://216.244.94.213:8080',
        changeOrigin: true,
        secure: false,
      },
      '/tools': {
        target: 'http://216.244.94.213:8080',
        changeOrigin: true,
        secure: false,
      },

      // WA REPORT PORT 8000
      '/whatsapp/contacts': {
        target: 'http://216.244.94.213:8000',
        changeOrigin: true,
        secure: false,
      },
      '/whatsapp/chat_history': {
        target: 'http://216.244.94.213:8000',
        changeOrigin: true,
        secure: false,
      },
      '/whatsapp/profile': {
        target: 'http://216.244.94.213:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    configureServer(server) {
      const app = createServer();

      // Add Express app as middleware to Vite dev server
      server.httpServer?.once("listening", () => {
        server.middlewares.use(app);
      });
    },
  };
}
