import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const repoName = "ielts-writing-examiner-lab";
const isPages = process.env.GITHUB_PAGES === "true";

export default defineConfig({
  base: isPages ? `/${repoName}/` : "/",
  plugins: [react()]
});
