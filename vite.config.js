import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const repoName = "IELTS-Writing-Examiner-Lab";
const isPages = process.env.GITHUB_PAGES === "true";

export default defineConfig({
  base: isPages ? `/${repoName}/` : "/",
  plugins: [react()]
});
