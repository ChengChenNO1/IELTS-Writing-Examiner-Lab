/**
 * Fetches IELTS Writing Task 1 practice items from ieltsliz.com
 * and writes public/data/task1-external.json for the frontend.
 *
 * Run: npm run fetch:task1
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_URL = "https://ieltsliz.com/ielts-sample-chart-for-writing-task-1/";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "public", "data", "task1-external.json");

const PROMPT_START =
  /^the (bar chart|line graph|graph|table|pie charts?|maps|diagram|chart|pie chart)/i;

const TYPE_HINTS = [
  { pattern: /line graph|the graph below/i, type: "line graph" },
  { pattern: /bar chart/i, type: "bar chart" },
  { pattern: /pie chart/i, type: "pie chart" },
  { pattern: /table below|the table/i, type: "table" },
  { pattern: /maps below|the maps/i, type: "map" },
  { pattern: /diagram below|process/i, type: "process" }
];

const CURATED = [
  {
    id: "ext-spreads",
    label: "Consumption of spreads (1981–2007)",
    type: "line graph",
    prompt:
      "The graph below shows the consumption of three kinds of spreads between 1981 and 2007. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    imageUrl: "https://ieltsliz.com/wp-content/uploads/2014/12/ielts-line-graph-spreads.png",
    source: "ieltsliz.com",
    keywords: ["graph", "consumption", "spreads", "1981", "2007"]
  },
  {
    id: "ext-fruit-veg",
    label: "Fruit and vegetables in the UK",
    type: "bar chart",
    prompt:
      "The bar chart below shows the percentage of people who ate five portions of fruit and vegetables per day in the UK from 2001 to 2008. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    imageUrl: "https://ieltsliz.com/wp-content/uploads/2018/10/IELTS-Writing-task-1-October-2018-1.png",
    source: "ieltsliz.com",
    keywords: ["bar", "chart", "fruit", "vegetables", "percentage", "2001", "2008"]
  },
  {
    id: "ext-consumer-goods",
    label: "Consumer goods expenditure",
    type: "bar chart",
    prompt:
      "The bar chart below shows the expenditure of two countries in consumer goods in 2010. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    imageUrl: "https://ieltsliz.com/wp-content/uploads/2015/01/Bar-Chart-Model-1024x612.jpg",
    source: "ieltsliz.com",
    keywords: ["bar", "chart", "expenditure", "countries", "consumer", "goods", "2010"]
  },
  {
    id: "ext-island-map",
    label: "Island tourist facilities",
    type: "map",
    prompt:
      "The maps below show an island, before and after the construction of some tourist facilities. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    imageUrl: "https://ieltsliz.com/wp-content/uploads/2015/01/ielts-map-island.png",
    source: "ieltsliz.com",
    keywords: ["maps", "island", "tourist", "facilities", "before", "after"]
  },
  {
    id: "ext-underground",
    label: "Underground railway systems",
    type: "table",
    prompt:
      "The table below gives information about the underground railway systems in 6 countries. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    imageUrl: "https://ieltsliz.com/wp-content/uploads/2015/01/ielts-table-underground.png",
    source: "ieltsliz.com",
    keywords: ["table", "underground", "railway", "systems", "countries"]
  }
];

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function guessType(prompt) {
  for (const hint of TYPE_HINTS) {
    if (hint.pattern.test(prompt)) return hint.type;
  }
  return "line graph";
}

function keywordsFromPrompt(prompt) {
  return Array.from(
    new Set(
      prompt
        .toLowerCase()
        .match(/[a-z]{4,}/g)
        ?.filter((w) => !["show", "below", "chart", "graph", "table", "information", "summarise"].includes(w))
        .slice(0, 12) ?? []
    )
  );
}

function decodeHtml(text) {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSections(html) {
  const content =
    html.match(/class="entry-content"[^>]*>([\s\S]*?)<\/div>\s*<\/motion>/i)?.[1] ??
    html.match(/class="entry-content"[^>]*>([\s\S]*?)<\/article>/i)?.[1] ??
    html;

  const sections = [];
  const blockRegex = /<h2[^>]*>([^<]+)<\/h2>([\s\S]*?)(?=<h2|$)/gi;
  let block;

  while ((block = blockRegex.exec(content)) !== null) {
    const blockHtml = block[2];
    const promptMatch = blockHtml.match(/<p>([^<]{30,}?)<\/p>/i);
    const imgMatch = blockHtml.match(/<img[^>]+src="([^"]+)"[^>]*>/i);
    if (!promptMatch || !imgMatch) continue;

    const prompt = decodeHtml(promptMatch[1]);
    if (!PROMPT_START.test(prompt)) continue;

    const src = imgMatch[1];
    const imageUrl = src.startsWith("http") ? src : `https://ieltsliz.com${src.startsWith("/") ? "" : "/"}${src}`;
    if (/logo|avatar|icon|banner|subscribe/i.test(imageUrl)) continue;

    const label = prompt.slice(0, 56).replace(/\.$/, "") + (prompt.length > 56 ? "…" : "");
    sections.push({
      id: `ext-${slugify(label)}`,
      label,
      type: guessType(prompt),
      prompt: prompt.endsWith(".") ? `${prompt} Summarise the information by selecting and reporting the main features, and make comparisons where relevant.` : prompt,
      imageUrl,
      source: "ieltsliz.com",
      keywords: keywordsFromPrompt(prompt)
    });
  }

  return sections;
}

function dedupe(topics) {
  const seen = new Set();
  return topics.filter((t) => {
    const key = t.prompt.slice(0, 80);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function main() {
  console.log(`Fetching ${SOURCE_URL} ...`);
  const res = await fetch(SOURCE_URL, {
    headers: {
      "User-Agent": "IELTS-Evaluator-Lab/0.1 (educational; local practice tool)"
    }
  });

  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  const scraped = extractSections(html);
  const topics = dedupe([...CURATED, ...scraped]).slice(0, 20);

  const bank = {
    fetchedAt: new Date().toISOString(),
    source: "ieltsliz.com",
    topics: topics.length ? topics : CURATED
  };

  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(bank, null, 2), "utf8");
  console.log(`Wrote ${bank.topics.length} topics to ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
