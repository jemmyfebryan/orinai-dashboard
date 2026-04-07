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
      // // DEVELOPMENT
      // // ORINAI CHAT PORT 8080
      // '/agents': {
      //   target: 'http://localhost:8080',
      //   changeOrigin: true,
      //   secure: false,
      // },
      // '/whatsapp/number': {
      //   target: 'http://localhost:8080',
      //   changeOrigin: true,
      //   secure: false,
      // },
      // '/tools': {
      //   target: 'http://localhost:8080',
      //   changeOrigin: true,
      //   secure: false,
      // },

      // // WA REPORT PORT 8000
      // '/notification_setting': {
      //   target: 'http://localhost:8000',
      //   changeOrigin: true,
      //   secure: false,
      // },
      // '/send-message': {
      //   target: 'http://localhost:8000',
      //   changeOrigin: true,
      //   secure: false,
      // },
      // '/whatsapp/disable_agent': {
      //   target: 'http://localhost:8000',
      //   changeOrigin: true,
      //   secure: false,
      // },
      // '/whatsapp/contacts': {
      //   target: 'http://localhost:8000',
      //   changeOrigin: true,
      //   secure: false,
      // },
      // '/whatsapp/chat_history': {
      //   target: 'http://localhost:8000',
      //   changeOrigin: true,
      //   secure: false,
      // },
      // '/whatsapp/profile': {
      //   target: 'http://localhost:8000',
      //   changeOrigin: true,
      //   secure: false,
      // },
      // '/whatsapp/dummy_notification': {
      //   target: 'http://localhost:8000',
      //   changeOrigin: true,
      //   secure: false,
      // },
      // '/whatsapp/phone_to_lid': {
      //   target: 'http://localhost:8000',
      //   changeOrigin: true,
      //   secure: false,
      // },

      // PRODUCTION
      // ORINAI CHAT PORT 8080
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
      '/notification_setting': {
        target: 'https://orinai-dashboard-proxy-1056582462205.asia-southeast1.run.app/wa_report',
        changeOrigin: true,
        secure: false,
      },
      '/send_message': {
        target: 'https://orinai-dashboard-proxy-1056582462205.asia-southeast1.run.app/wa_report/whatsapp',
        changeOrigin: true,
        secure: false,
      },
      '/disable_agent': {
        target: 'https://orinai-dashboard-proxy-1056582462205.asia-southeast1.run.app/wa_report/whatsapp',
        changeOrigin: true,
        secure: false,
      },
      '/contacts': {
        target: 'https://orinai-dashboard-proxy-1056582462205.asia-southeast1.run.app/wa_report/whatsapp',
        changeOrigin: true,
        secure: false,
      },
      '/chat_history': {
        target: 'https://orinai-dashboard-proxy-1056582462205.asia-southeast1.run.app/wa_report/whatsapp',
        changeOrigin: true,
        secure: false,
      },
      '/profile': {
        target: 'https://orinai-dashboard-proxy-1056582462205.asia-southeast1.run.app/wa_report/whatsapp',
        changeOrigin: true,
        secure: false,
      },
      '/dummy_notification': {
        target: 'https://orinai-dashboard-proxy-1056582462205.asia-southeast1.run.app/wa_report',
        changeOrigin: true,
        secure: false,
      },
      '/phone_to_lid': {
        target: 'https://orinai-dashboard-proxy-1056582462205.asia-southeast1.run.app/wa_report',
        changeOrigin: true,
        secure: false,
      },

      // SIORIN - Local development proxy to localhost:8081
      // In production, dashboard goes through Netlify function, admin routes go via redirects
      '/siorin': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/siorin/, ''),
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
