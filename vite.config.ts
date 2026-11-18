import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [reactRouter()],
  resolve: { tsconfigPaths: true },
  server: {
    host: "127.0.0.1",
    port: 5174,
    strictPort: true,
    // The archive PDFs are large and uploads are re-staged on restart; neither needs watching.
    watch: {
      ignored: ["**/public/herald/**", "**/public/media/**", "**/.data/**"],
    },
  },
});
