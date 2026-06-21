import { defineConfig } from "vite";

// Static SPA. Deploys serverless on Vercel out of the box (framework preset: Vite).
// Step 1 is single-player — no server, no API routes. Co-op (step 4) goes on a
// separate always-on host later, per the design doc.
export default defineConfig({
  base: "./",
  build: {
    target: "es2020",
    outDir: "dist",
    sourcemap: true,
  },
  server: {
    port: 5173,
    open: true,
  },
});
