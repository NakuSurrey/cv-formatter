import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// using Vite with the React plugin — handles JSX transformation automatically
export default defineConfig({
  plugins: [react()],
});
