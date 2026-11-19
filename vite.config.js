import { defineConfig } from "vite";
import { localAssistPlugin } from "./scripts/local-assist.mjs";
export default defineConfig({
  root: "web",
  base: "./",
  build: { outDir: "../dist", emptyOutDir: true },
  plugins: [localAssistPlugin()],
});
