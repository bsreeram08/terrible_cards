import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    server: {
      watch: {
        ignored: ["**/node_modules/**", "**/.git/**", "**/.vinxi/**", "**/.output/**"]
      }
    }
  },
  server: {
    preset: "firebase",
    firebase: {
      gen: 2,  // Use Cloud Functions Gen 2
      nodeVersion: "20",
      region: "us-central1"
    }
  }
});
