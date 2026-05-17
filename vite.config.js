import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
var repoName = "IELTS-Writing-Examiner-Lab";
var isPages = process.env.GITHUB_PAGES === "true";
export default defineConfig({
    base: isPages ? "/".concat(repoName, "/") : "/",
    plugins: [react()]
});
