import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    svelte({
      preprocess: {
        typescript: true,
      },
    }),
  ],
  server: {
    port: 4500,
    open: false,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    target: "ES2020",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["svelte"],
        },
      },
    },
  },
  publicDir: "public",
  resolve: {
    alias: {
      $lib: resolve("./src/lib"),
      $types: resolve("./src/lib/types"),
      $components: resolve("./src/lib/components"),
      $stores: resolve("./src/lib/stores"),
      "$game-engine": resolve("./src/lib/game-engine"),
    },
  },
  esbuild: {
    target: "ES2020",
  },
  optimizeDeps: {
    include: ["svelte"],
  },
});
