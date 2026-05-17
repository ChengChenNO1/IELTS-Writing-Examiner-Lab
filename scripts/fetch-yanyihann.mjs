/**
 * Downloads all IELTS Writing prompts from yanyihann.github.io/ielts-site
 * Source: https://github.com/YanYihann/ielts-site/blob/main/data.json
 *
 * Run: npm run fetch:yanyihann
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_URL = "https://raw.githubusercontent.com/YanYihann/ielts-site/main/data.json";
const SITE_URL = "https://yanyihann.github.io/ielts-site/";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "public", "data", "yanyihann-writing.json");

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function inferTask2Type(prompt) {
  const p = prompt.toLowerCase();
  if (/discuss both views|discuss both sides|while others/.test(p)) return "discussion";
  if (/advantages outweigh|disadvantages outweigh|advantages and disadvantages/.test(p)) return "advantages";
  if (/what problems|what solutions|what measures|how can|how should/.test(p)) return "problem-solution";
  return "opinion";
}

function keywordsFromPrompt(prompt) {
  return Array.from(
    new Set(
      prompt
        .toLowerCase()
        .match(/[a-z]{4,}/g)
        ?.filter((w) => !["that", "this", "with", "from", "have", "been", "their", "people", "some", "what", "when", "which"].includes(w))
        .slice(0, 12) ?? []
    )
  );
}

function makeLabel(item, index) {
  const date = item.date ? String(item.date).replace(/\//g, "-") : `y${item.year}`;
  const topic = item.topic ? String(item.topic).split("&")[0].trim() : "General";
  const short = topic.length > 18 ? `${topic.slice(0, 16)}…` : topic;
  return `${date} · ${short}`;
}

function toTopic(item, index) {
  const en = String(item.en ?? "").trim();
  if (!en) return null;

  const year = Number(item.year) || null;
  const date = item.date ? String(item.date) : null;
  const topicCategory = item.topic ? String(item.topic) : "General";
  const id = `yh-${year ?? "x"}-${slugify(date ?? index)}-${index}`;

  const views = Array.isArray(item.views)
    ? item.views
        .filter((v) => v && (v.claim_zh || v.claim_en || v.analysis_zh || v.analysis_en))
        .map((v) => ({
          side: v.side ?? "",
          claimZh: String(v.claim_zh ?? "").trim(),
          claimEn: String(v.claim_en ?? "").trim(),
          analysisZh: String(v.analysis_zh ?? "").trim(),
          analysisEn: String(v.analysis_en ?? "").trim()
        }))
    : [];

  return {
    id,
    label: makeLabel(item, index),
    prompt: en,
    task: "task2",
    type: inferTask2Type(en),
    keywords: keywordsFromPrompt(en),
    source: "yanyihann",
    year,
    examDate: date,
    topicCategory,
    promptZh: item.zh ? String(item.zh).trim() : undefined,
    variant: item.variant ?? null,
    views: views.length ? views : undefined,
    sourceUrl: SITE_URL
  };
}

async function fetchJson(url, attempts = 4) {
  let lastError;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "IELTS-Evaluator-Lab/0.1 (educational)" }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return await res.json();
    } catch (err) {
      lastError = err;
      await new Promise((r) => setTimeout(r, 800 * (i + 1)));
    }
  }
  throw lastError;
}

async function main() {
  console.log(`Fetching ${SOURCE_URL} ...`);
  const raw = await fetchJson(SOURCE_URL);
  if (!Array.isArray(raw)) throw new Error("Expected data.json to be an array");

  const topics = raw.map(toTopic).filter(Boolean);
  const bank = {
    fetchedAt: new Date().toISOString(),
    source: SITE_URL,
    dataSource: SOURCE_URL,
    count: topics.length,
    topics
  };

  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(bank, null, 2), "utf8");
  console.log(`Wrote ${topics.length} writing topics to ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
