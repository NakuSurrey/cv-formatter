import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// configuring Vite to use React plugin and set base path for Hetzner subpath deployment
export default defineConfig({
  plugins: [react()],
  base: "/cv-formatter/",
});