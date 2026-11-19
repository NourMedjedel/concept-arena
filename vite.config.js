import { defineConfig } from "vite";
import { localAssistPlugin } from "./scripts/local-assist.mjs";
export default defineConfig({
  root: "web",
  server: { host: "127.0.0.1", port: 8789, strictPort: true },
  base: "./",
  build: { outDir: "../dist", emptyOutDir: true },
  plugins: [
    localAssistPlugin(),
    {
      name: "local-csp-websocket",
      transformIndexHtml(html, context) {
        return context.server
          ? html.replace(
              "connect-src 'self'",
              "connect-src 'self' ws://127.0.0.1:8789 ws://localhost:8789",
            )
          : html;
      },
    },
  ],
});
