/**
 * Fetches IELTS Writing tasks from ieltscb.com (学为贵机考写作题库).
 * - Cambridge bank: WriteQuestion/list?type=1|2
 * - Recall / prediction bank: WriteQuestion/predictionWriteList?type=1|2
 *
 * Run: npm run fetch:ieltscb
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "public", "data", "ieltscb-task1.json");
const SITE = "https://www.ieltscb.com";

const WRITE_TYPE_TASK1 = {
  1: "bar chart",
  2: "pie chart",
  3: "table",
  4: "line graph",
  5: "line graph",
  6: "map",
  7: "process"
};

const WRITE_TYPE_TASK2_CAT = {
  8: "Education",
  9: "Society",
  10: "Culture",
  11: "Environment",
  12: "Technology",
  13: "Government"
};

const CHART_ZH = {
  柱状图: "bar chart",
  饼状图: "pie chart",
  表格: "table",
  折线图: "line graph",
  混合图: "line graph",
  地图: "map",
  流程图: "process"
};

const headers = (referer) => ({
  "User-Agent": "IELTS-Evaluator-Lab/0.1 (educational; local practice tool)",
  Accept: "application/json",
  Referer: referer,
  "X-Requested-With": "XMLHttpRequest"
});

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function decodeHtml(text) {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripHtml(html) {
  if (!html) return "";
  return decodeHtml(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<img[^>]*>/gi, "")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractImageUrl(html) {
  const m = html?.match(/<img[^>]+src="([^"]+)"/i);
  return m?.[1] ?? undefined;
}

function parseExamDate(text) {
  const m = text.match(/[（(](\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})[）)]/);
  if (!m) return null;
  return { year: Number(m[1]), examDate: `${m[1]}/${Number(m[2])}/${Number(m[3])}`, labelDate: `${m[1]}-${Number(m[2])}-${Number(m[3])}` };
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
        ?.filter((w) => !["that", "this", "with", "from", "have", "been", "their", "people", "some", "what", "when", "which", "should", "about"].includes(w))
        .slice(0, 12) ?? []
    )
  );
}

function chartTypeFromName(name, writeType, task) {
  if (task === "task2") return inferTask2Type("");
  if (writeType && WRITE_TYPE_TASK1[writeType]) return WRITE_TYPE_TASK1[writeType];
  for (const [zh, en] of Object.entries(CHART_ZH)) {
    if (name.includes(zh)) return en;
  }
  return "line graph";
}

function categoryFromName(name, writeType, task) {
  if (task === "task2") {
    if (writeType && WRITE_TYPE_TASK2_CAT[writeType]) return WRITE_TYPE_TASK2_CAT[writeType];
    const m = name.match(/(教育|社会|文化|生活|环境|技术|政府)类?/);
    if (m) {
      const map = { 教育: "Education", 社会: "Society", 文化: "Culture", 生活: "Culture", 环境: "Environment", 技术: "Technology", 政府: "Government" };
      return map[m[1]] ?? "General";
    }
    return "General";
  }
  const m = name.match(/(表格|柱状图|饼状图|折线图|混合图|地图|流程图)/);
  return m?.[1] ?? "Chart";
}

function makeLabel({ name, examMeta, task, category }) {
  if (examMeta?.labelDate) {
    return `${examMeta.labelDate} ${category}`;
  }
  const cam = name.match(/^(C\d+)T(\d+)\s+(.+)$/i);
  if (cam) {
    const chart = cam[3].trim();
    return `${cam[1]}-T${cam[2]} ${chart}`;
  }
  const pred = name.match(/^预测\s*(\d+)\s+(.+)$/);
  if (pred) return `预测${pred[1]} · ${pred[2].trim()}`;
  return name.trim();
}

function buildPrompt(rawContent, rawDesc) {
  const content = stripHtml(rawContent);
  const desc = stripHtml(rawDesc);
  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !/^\(\d{4}/.test(l) && !/^（\d{4}/.test(l) && !/^write at least/i.test(l) && !/^you should spend/i.test(l));

  const body = lines.join("\n").trim();
  if (body.length > 40) return body;
  return [desc, body].filter(Boolean).join("\n\n").trim();
}

async function fetchJson(url, referer) {
  const res = await fetch(url, { headers: headers(referer) });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const json = await res.json();
  if (json.e !== "9999") throw new Error(json.m || "API error");
  return json.data;
}

async function fetchList(endpoint, type) {
  const referer = `${SITE}/WriteQuestion/listpage?type=${type}&tab_type=1`;
  const data = await fetchJson(`${SITE}/WriteQuestion/${endpoint}?type=${type}`, referer);
  return data.list ?? [];
}

async function fetchDetail(item) {
  const url = item.url.startsWith("http") ? item.url : `${SITE}${item.url}`;
  const referer = `${SITE}/WriteQuestion/listpage?type=1`;
  const data = await fetchJson(url, referer);
  return data;
}

function toTopic(detail, meta, task, bank) {
  const html = detail.content ?? "";
  const prompt = buildPrompt(html, detail.desc);
  if (!prompt || prompt.length < 30) return null;

  const examMeta = parseExamDate(html + stripHtml(detail.desc ?? ""));
  const category = categoryFromName(meta.name, meta.write_type, task);
  const type =
    task === "task1"
      ? chartTypeFromName(meta.name, meta.write_type, task)
      : inferTask2Type(prompt);
  const label = makeLabel({ name: meta.name, examMeta, task, category });
  const imageUrl = extractImageUrl(html);

  const id = `cb-${bank}-${task}-${meta.id}`;

  return {
    id,
    label,
    prompt,
    task,
    type,
    keywords: keywordsFromPrompt(prompt),
    source: bank === "recall" ? "ieltscb-recall" : "ieltscb",
    year: examMeta?.year ?? null,
    examDate: examMeta?.examDate ?? null,
    topicCategory: category,
    imageUrl,
    imageRemoteUrl: imageUrl,
    sourceUrl: `${SITE}/WriteQuestion/listpage?type=${task === "task1" ? 1 : 2}&tab_type=1`,
    bank,
    listName: meta.name
  };
}

async function mapPool(items, task, bank, concurrency = 4) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const i = index++;
      const item = items[i];
      try {
        const detail = await fetchDetail(item);
        const topic = toTopic(detail, item, task, bank);
        if (topic) results.push(topic);
        if ((i + 1) % 10 === 0) console.log(`  ${bank} task${task === "task1" ? 1 : 2}: ${i + 1}/${items.length}`);
        await new Promise((r) => setTimeout(r, 120));
      } catch (err) {
        console.warn(`  skip ${item.name} (${item.id}):`, err.message);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results;
}

function dedupe(topics) {
  const seen = new Set();
  return topics.filter((t) => {
    const key = t.prompt.slice(0, 100);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function main() {
  console.log("Fetching ieltscb.com Task 1 only (小作文)…");

  const camT1 = await fetchList("list", 1);
  const recallT1 = await fetchList("predictionWriteList", 1);

  console.log(`Cambridge Task1=${camT1.length}, Recall Task1=${recallT1.length}`);

  const topics = dedupe([
    ...(await mapPool(camT1, "task1", "cambridge")),
    ...(await mapPool(recallT1, "task1", "recall"))
  ]);

  const bank = {
    fetchedAt: new Date().toISOString(),
    source: SITE,
    count: topics.length,
    task: "task1",
    breakdown: {
      cambridge: topics.filter((t) => t.bank === "cambridge").length,
      recall: topics.filter((t) => t.bank === "recall").length
    },
    topics
  };

  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(bank, null, 2), "utf8");
  console.log(`Wrote ${bank.count} topics to ${OUT}`);
  console.log(bank.breakdown);
  console.log("Run: npm run mirror:task1-images  (download chart images locally)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
