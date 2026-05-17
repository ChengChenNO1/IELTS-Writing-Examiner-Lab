# IELTS Writing Examiner Lab

Rubric-locked IELTS Academic Writing practice with local scoring, optional AI examiner feedback (OpenAI / DeepSeek / **Grok** / OpenRouter), Task 1 charts, and 600+ real Task 2 prompts.

**Live site:** https://chengchenno1.github.io/IELTS-Writing-Examiner-Lab/

## Features

- Task 1 & Task 2 with built-in topics, chart visuals, and scraped practice charts
- 601 real Task 2 prompts (2013–2026) from [ielts-site](https://yanyihann.github.io/ielts-site/)
- Local rule-based scoring (no API required)
- **AI grading** with native English polishing (sentence-level edits, collocations, model paragraph)
- Optional **built-in API** for local dev (Volcengine Ark via `.env.local`, never committed)
- Custom API key stored only in your browser (`localStorage`)

## Built-in AI (local only, not on GitHub)

1. Copy `env.example` → `.env.local`
2. Set `VITE_BUILTIN_ARK_API_KEY=ark-your-key-here` (Volcengine Ark console)
3. Restart `npm run dev`
4. In the app: enable **使用内置 API** — leave custom Key empty to use builtin

The key is injected at dev time only. **GitHub Pages builds do not include any secret.** Online visitors must use their own API key.

Default builtin model: `deepseek-v3-2-251201` via `https://ark.cn-beijing.volces.com/api/v3/chat/completions` (OpenAI-compatible; no web_search in examiner mode).

## AI providers

| Provider | Base URL | Key format |
|----------|----------|------------|
| **Volcengine Ark** | `https://ark.cn-beijing.volces.com/api/v3` | `ark-...` |
| OpenAI | `https://api.openai.com/v1` | `sk-...` |
| DeepSeek | `https://api.deepseek.com/v1` | `sk-...` |
| **Grok (xAI)** | `https://api.x.ai/v1` | `xai-...` |
| OpenRouter | `https://openrouter.ai/api/v1` | `sk-or-...` |
| Custom | Any OpenAI-compatible endpoint | — |

## Local development

```bash
npm install
cp env.example .env.local   # then add your ark- key
npm run dev
```

Open http://127.0.0.1:5173

## Update question banks

```bash
npm run fetch:yanyihann
npm run fetch:task1
```

## Deploy to GitHub Pages

1. Repository: **[ChengChenNO1/IELTS-Writing-Examiner-Lab](https://github.com/ChengChenNO1/IELTS-Writing-Examiner-Lab)**
2. Push to the `main` branch — workflow builds and pushes static files to the **`gh-pages`** branch.
3. In GitHub → **Settings → Pages → Build and deployment**:
   - **Source:** Deploy from a branch
   - **Branch:** `gh-pages` / **Folder:** `/ (root)`
4. Wait 1–3 minutes, then open https://chengchenno1.github.io/IELTS-Writing-Examiner-Lab/

### Why “from branch” instead of “GitHub Actions” as Pages source?

| Pages 设置里的 Source | 含义 |
|---------------------|------|
| **Deploy from a branch** | GitHub 直接托管某个分支里的静态文件（本项目用 `gh-pages` 分支） |
| **GitHub Actions** | 由 `actions/deploy-pages` 在 Actions 里创建“Pages 部署”，**必须**选这项才能用旧版 workflow |

本项目 workflow 会把构建结果推到 **`gh-pages` 分支**，因此 Pages 里应选 **from branch → gh-pages**，不要选 GitHub Actions，否则会出现 `Failed to create deployment (404)`。

If your repo name differs, change `repoName` in `vite.config.js` before pushing.

## Build

```bash
npm run build          # local (base /)
GITHUB_PAGES=true npm run build   # same as CI for Pages
```

## License

Educational use. Third-party prompts and charts retain their original sources (IELTS Liz, yanyihann/ielts-site, etc.).
