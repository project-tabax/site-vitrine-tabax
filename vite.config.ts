import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// Les assets d'origine (wp-content, wp-includes, _ext) sont copiés dans public/
// par `npm run sync-assets` et servis tels quels aux chemins racine d'origine.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: "127.0.0.1",
  },
});
