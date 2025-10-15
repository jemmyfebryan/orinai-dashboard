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
      '/notification_setting': {
        target: 'https://orinai-dashboard-proxy-1056582462205.asia-southeast1.run.app/ai_chat',
        changeOrigin: true,
        secure: false,
      },
      '/agents': {
        target: 'https://orinai-dashboard-proxy-1056582462205.asia-southeast1.run.app/ai_chat',
        changeOrigin: true,
        secure: false,
      },
      '/whatsapp/number': {
        target: 'https://orinai-dashboard-proxy-1056582462205.asia-southeast1.run.app/ai_chat',
        changeOrigin: true,
        secure: false,
      },
      '/tools': {
        target: 'https://orinai-dashboard-proxy-1056582462205.asia-southeast1.run.app/ai_chat',
        changeOrigin: true,
        secure: false,
      },

      // WA REPORT PORT 8000
      '/whatsapp/contacts': {
        target: 'https://orinai-dashboard-proxy-1056582462205.asia-southeast1.run.app/wa_report',
        changeOrigin: true,
        secure: false,
      },
      '/whatsapp/chat_history': {
        target: 'https://orinai-dashboard-proxy-1056582462205.asia-southeast1.run.app/wa_report',
        changeOrigin: true,
        secure: false,
      },
      '/whatsapp/profile': {
        target: 'https://orinai-dashboard-proxy-1056582462205.asia-southeast1.run.app/wa_report',
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
