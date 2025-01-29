import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, "popup.html"),
        options: path.resolve(__dirname, "options.html"),
        service_worker: path.resolve(__dirname, "src/background.ts"),
        content_script: path.resolve(__dirname, "src/content-script.ts"),
      },
      output: {
        chunkFileNames: "[name].[hash].js",
        assetFileNames: "[name].[ext]",
        entryFileNames: "[name].js",
        dir: "dist",
        inlineDynamicImports: false,
      },
    },
    cssCodeSplit: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
