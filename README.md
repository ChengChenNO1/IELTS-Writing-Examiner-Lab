# IELTS Writing Examiner Lab

Rubric-locked IELTS Academic Writing practice with local scoring, optional AI examiner feedback (OpenAI / DeepSeek / **Grok** / OpenRouter), Task 1 charts, and 600+ real Task 2 prompts.

**Live site:** `https://<your-github-username>.github.io/ielts-writing-examiner-lab/`  
(Available after you push to GitHub and enable Pages — see below.)

## Features

- Task 1 & Task 2 with built-in topics, chart visuals, and scraped practice charts
- 601 real Task 2 prompts (2013–2026) from [ielts-site](https://yanyihann.github.io/ielts-site/)
- Local rule-based scoring (no API required)
- **AI grading** with native English polishing (sentence-level edits, collocations, model paragraph)
- API key stored only in your browser (`localStorage`)

## AI providers

| Provider | Base URL | Key format |
|----------|----------|------------|
| OpenAI | `https://api.openai.com/v1` | `sk-...` |
| DeepSeek | `https://api.deepseek.com/v1` | `sk-...` |
| **Grok (xAI)** | `https://api.x.ai/v1` | `xai-...` |
| OpenRouter | `https://openrouter.ai/api/v1` | `sk-or-...` |
| Custom | Any OpenAI-compatible endpoint | — |

Get a Grok key: [console.x.ai](https://console.x.ai/)

## Local development

```bash
npm install
npm run dev
```

Open http://127.0.0.1:5173

## Update question banks

```bash
npm run fetch:yanyihann
npm run fetch:task1
```

## Deploy to GitHub Pages

1. Create a repository named **`ielts-writing-examiner-lab`** (or update `base` in `vite.config.js` to match your repo name).
2. Push this project to the `main` branch.
3. In GitHub → **Settings → Pages → Build and deployment**, set source to **GitHub Actions**.
4. The workflow `.github/workflows/deploy-pages.yml` will build and publish automatically.

If your repo name differs, change `repoName` in `vite.config.js` before pushing.

## Build

```bash
npm run build          # local (base /)
GITHUB_PAGES=true npm run build   # same as CI for Pages
```

## License

Educational use. Third-party prompts and charts retain their original sources (IELTS Liz, yanyihann/ielts-site, etc.).
