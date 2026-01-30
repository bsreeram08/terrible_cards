import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    server: {
      watch: {
        ignored: ["**/node_modules/**", "**/.git/**", "**/.vinxi/**", "**/.vercel/**"]
      }
    }
  },
  server: {
    preset: "vercel"
  }
});
