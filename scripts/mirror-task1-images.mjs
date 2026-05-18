/**
 * Download Task 1 chart images from gximg CDN into public/data/task1-images/
 * and rewrite ieltscb-task1.json to use local paths.
 *
 * Run: npm run mirror:task1-images
 */
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const BANK_PATH = path.join(ROOT, "public", "data", "ieltscb-task1.json");
const IMAGE_DIR = path.join(ROOT, "public", "data", "task1-images");
const REFERER = "https://www.ieltscb.com/";

function extFromUrl(url) {
  const m = String(url).match(/\.(png|jpe?g|webp|gif)(\?|$)/i);
  return m ? `.${m[1].toLowerCase()}` : ".png";
}

function imageHeaders(remoteUrl) {
  const h = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" };
  // gximg 需要来源站；阿里云 OSS 带 Referer 反而会 403
  if (/gximg\.cn/i.test(remoteUrl)) h.Referer = REFERER;
  return h;
}

async function downloadImage(remoteUrl, destPath) {
  try {
    await access(destPath);
    return true;
  } catch {
    /* not cached */
  }

  const res = await fetch(remoteUrl, { headers: imageHeaders(remoteUrl) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(destPath, buf);
  return true;
}

async function main() {
  const { readFile } = await import("node:fs/promises");
  const bank = JSON.parse(await readFile(BANK_PATH, "utf8"));
  await mkdir(IMAGE_DIR, { recursive: true });

  let ok = 0;
  let fail = 0;

  for (const topic of bank.topics) {
    const remote = topic.imageRemoteUrl ?? (/^https?:\/\//i.test(topic.imageUrl) ? topic.imageUrl : null);
    if (!remote) {
      if (!topic.imageUrl?.startsWith("data/")) fail += 1;
      continue;
    }

    const ext = extFromUrl(remote);
    const localRel = `data/task1-images/${topic.id}${ext}`;
    const dest = path.join(ROOT, "public", localRel);

    if (topic.imageUrl?.startsWith("data/")) {
      try {
        await access(dest);
        ok += 1;
        continue;
      } catch {
        /* file missing — re-download */
      }
    }

    try {
      await downloadImage(remote, dest);
      topic.imageRemoteUrl = remote;
      topic.imageUrl = localRel;
      ok += 1;
      if (ok % 10 === 0) console.log(`  mirrored ${ok}/${bank.topics.length}`);
    } catch (err) {
      console.warn(`  fail ${topic.label}:`, err.message);
      fail += 1;
    }

    await new Promise((r) => setTimeout(r, 80));
  }

  bank.imagesMirroredAt = new Date().toISOString();
  await writeFile(BANK_PATH, JSON.stringify(bank, null, 2), "utf8");
  console.log(`Done: ${ok} saved, ${fail} failed → ${BANK_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
