import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * Production-Ready Vite Configuration
 * Optimized for performance, code splitting, and caching
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],

  // Build optimizations
  build: {
    // Increase chunk size warning limit to 600kb
    chunkSizeWarningLimit: 600,

    // Enable source maps for production debugging (optional)
    sourcemap: false,

    // Optimize chunks
    rollupOptions: {
      output: {
        // Manual chunking strategy for better caching
        manualChunks: {
          // Vendor chunk for React and core libraries
          vendor: ["react", "react-dom", "react-router-dom"],

          // UI library chunks
          ui: ["@radix-ui/themes", "framer-motion", "lucide-react"],

          // Form and validation libraries
          forms: ["react-hook-form", "@hookform/resolvers", "zod"],

          // HTTP and utilities
          utils: ["axios", "date-fns", "react-hot-toast"],

          // Charts and data visualization
          charts: ["recharts"],

          // Admin-specific components (lazy loaded)
          admin: [
            "./src/pages/admin/AdminDashboard",
            "./src/pages/admin/AdminOverview",
            "./src/pages/admin/AdminStudents",
            "./src/pages/admin/AdminResults",
            "./src/pages/admin/AdminPayments",
            "./src/pages/admin/AdminEvents",
          ],
        },

        // Optimize chunk names for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId
                .split("/")
                .pop()
                ?.replace(/\.[^/.]+$/, "")
            : "chunk";
          return `js/${facadeModuleId}-[hash].js`;
        },

        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split(".") || ["asset"];
          const ext = info[info.length - 1];

          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `img/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext)) {
            return `css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },

    // Minification options
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
      },
    },
  },

  // Development server configuration
  server: {
    port: 3000,
    host: true, // Allow external connections
    open: true, // Auto-open browser
  },

  // Preview server configuration
  preview: {
    port: 4173,
    host: true,
  },

  // Environment variable handling
  envPrefix: "VITE_",

  // Dependency optimization
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "axios",
      "react-hot-toast",
      "framer-motion",
      "lucide-react",
    ],
  },
});
