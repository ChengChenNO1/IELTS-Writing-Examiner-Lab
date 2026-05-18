# -*- coding: utf-8 -*-
"""
Extract Simon IELTS model essays from local PDFs into public/data/simon-essays.json

Run: npm run import:simon
"""
from __future__ import annotations

import json
import re
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "data" / "simon-essays.json"

TASK1_TYPE_PATTERNS = [
    (r"line graph", "line graph"),
    (r"bar chart", "bar chart"),
    (r"pie chart", "pie chart"),
    (r"\btable\b", "table"),
    (r"\bmaps?\b", "map"),
    (r"diagram|process|cycle|stages in the life", "process"),
    (r"\bchart\b", "bar chart"),
]


def slugify(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return s[:48] or "essay"


def infer_task1_type(text: str) -> str:
    lower = text.lower()
    for pattern, t in TASK1_TYPE_PATTERNS:
        if re.search(pattern, lower):
            return t
    return "line graph"


def infer_task2_type(prompt: str) -> str:
    p = prompt.lower()
    if re.search(r"discuss both views|discuss both sides|while others", p):
        return "discussion"
    if re.search(r"advantages outweigh|disadvantages outweigh|advantages and disadvantages", p):
        return "advantages"
    if re.search(r"what problems|what solutions|what measures|how can|how should", p):
        return "problem-solution"
    return "opinion"


def keywords_from_text(text: str) -> list[str]:
    words = re.findall(r"[a-z]{4,}", text.lower())
    stop = {
        "that", "this", "with", "from", "have", "been", "their", "people", "some",
        "what", "when", "which", "should", "about", "would", "could", "there",
    }
    out: list[str] = []
    for w in words:
        if w not in stop and w not in out:
            out.append(w)
        if len(out) >= 12:
            break
    return out


def task1_title_from_essay(text: str) -> str:
    first = text.strip().split("\n")[0].strip()
    first = re.sub(r"\s+", " ", first)
    if len(first) > 72:
        first = first[:70] + "…"
    return first


def task1_prompt_from_essay(text: str, chart_type: str) -> str:
    first = text.strip().split("\n")[0].strip()
    # Turn Simon's overview opening into a task-style stem when possible
    if re.match(r"^the (line graph|bar chart|pie chart|table|diagram|chart|maps?)\b", first, re.I):
        stem = re.sub(
            r"^(The (?:line graph|bar chart|pie chart|table|diagram|chart|maps?))\s+(compares|shows|illustrates|gives)",
            r"\1 below \2",
            first,
            count=1,
            flags=re.I,
        )
        return (
            f"{stem}. Summarise the information by selecting and reporting the main features, "
            "and make comparisons where relevant."
        )
    return (
        f"The {chart_type} below shows related data. Summarise the information by selecting "
        "and reporting the main features, and make comparisons where relevant."
    )


def parse_task2_pdf(pdf_path: Path) -> list[dict]:
    doc = fitz.open(pdf_path)
    items: list[dict] = []

    for page_index in range(doc.page_count):
        text = doc[page_index].get_text("text").strip()
        if not text or text.startswith("目录"):
            continue

        m = re.match(r"(\d+)\.\s*([^\n]+)", text)
        if not m:
            continue

        num, zh_title = m.group(1), m.group(2).strip()
        zh_title = re.sub(r"\.{2,}.*$", "", zh_title).strip()

        body = text[m.end() :].strip()
        question = ""
        essay = ""

        if "范文" in body:
            parts = re.split(r"范文[：:]\s*", body, maxsplit=1)
            question = parts[0].strip()
            essay = parts[1].strip() if len(parts) > 1 else ""
        else:
            # Some pages omit the marker; essay often starts with discourse markers
            split = re.split(
                r"\n(?=It is (?:true|sometimes)|I completely|In my view|Some people|Many people|We |One |On the one hand)",
                body,
                maxsplit=1,
            )
            if len(split) == 2:
                question, essay = split[0].strip(), split[1].strip()
            else:
                essay = body

        essay = re.sub(r"\(\d+\s*words?,\s*band\s*\d+\)\s*$", "", essay, flags=re.I).strip()
        question = re.sub(r"\n{2,}", "\n", question).strip()

        if len(essay) < 120:
            continue

        prompt = question if len(question) > 40 else essay[:200]
        ttype = infer_task2_type(prompt)
        label = f"范文 · T2 · {zh_title}"

        items.append(
            {
                "id": f"simon-t2-{num}",
                "label": label,
                "prompt": prompt,
                "task": "task2",
                "type": ttype,
                "keywords": keywords_from_text(prompt),
                "source": "simon",
                "contentKind": "model",
                "topicCategory": zh_title,
                "modelEssay": essay,
                "sourceUrl": str(pdf_path.name),
            }
        )

    return items


def parse_task1_pdf(pdf_path: Path) -> list[dict]:
    doc = fitz.open(pdf_path)
    items: list[dict] = []

    for page_index in range(doc.page_count):
        text = doc[page_index].get_text("text").strip()
        if len(text) < 120:
            continue

        essay = re.sub(r"\(\d+\s*words?,\s*band\s*\d+\)\s*$", "", text, flags=re.I).strip()
        chart_type = infer_task1_type(essay)
        short = task1_title_from_essay(essay)
        label = f"范文 · T1 · {chart_type} · {short[:36]}"

        items.append(
            {
                "id": f"simon-t1-{page_index + 1}",
                "label": label,
                "prompt": task1_prompt_from_essay(essay, chart_type),
                "task": "task1",
                "type": chart_type,
                "keywords": keywords_from_text(essay),
                "source": "simon",
                "contentKind": "model",
                "topicCategory": chart_type,
                "modelEssay": essay,
                "sourceUrl": str(pdf_path.name),
            }
        )

    return items


def parse_ideas_pdf(pdf_path: Path) -> list[dict]:
    """Ideas PDF: topic prompts / ideas — import as reference prompts, not full essays."""
    doc = fitz.open(pdf_path)
    items: list[dict] = []
    current_topic = ""
    buffer: list[str] = []

    def flush():
        nonlocal buffer, current_topic
        if not current_topic or not buffer:
            buffer = []
            return
        text = "\n".join(buffer).strip()
        buffer = []
        if len(text) < 80:
            return
        # English question heuristic
        en_lines = [ln for ln in text.split("\n") if re.search(r"[a-zA-Z]{4,}", ln)]
        prompt = "\n".join(en_lines[:6]).strip() if en_lines else text[:500]
        if len(prompt) < 40:
            return
        ttype = infer_task2_type(prompt)
        items.append(
            {
                "id": f"simon-idea-{slugify(current_topic)}-{len(items)}",
                "label": f"ideas · {current_topic[:24]}",
                "prompt": prompt,
                "task": "task2",
                "type": ttype,
                "keywords": keywords_from_text(prompt),
                "source": "simon-ideas",
                "contentKind": "ideas",
                "topicCategory": current_topic,
                "promptZh": text if text != prompt else None,
                "sourceUrl": str(pdf_path.name),
            }
        )

    for page_index in range(doc.page_count):
        text = doc[page_index].get_text("text")
        for line in text.split("\n"):
            line = line.strip()
            if not line:
                continue
            if re.match(r"^#{1,3}\s+", line) or re.match(r"^[A-Z][^a-z]{0,3}[\u4e00-\u9fff]", line):
                flush()
                current_topic = re.sub(r"^#+\s*", "", line).strip()
                continue
            if re.match(r"^\d+\.\s+[\u4e00-\u9fff]", line):
                flush()
                current_topic = re.sub(r"^\d+\.\s*", "", line).strip()
                continue
            buffer.append(line)
    flush()

    return items[:80]  # cap noisy extraction


def main():
    task2_pdf = ROOT / "考官Simon雅思大作文范文(28篇).pdf"
    ideas_pdf = ROOT / "Ideas-for-IELTS-topics-(simon)(中文译稿).pdf"

    topics: list[dict] = []
    if task2_pdf.exists():
        topics.extend(parse_task2_pdf(task2_pdf))
        print(f"Task2 essays: {len(topics)}")
    if ideas_pdf.exists():
        ideas = parse_ideas_pdf(ideas_pdf)
        topics.extend(ideas)
        print(f"Ideas entries: {len(ideas)}")

    bank = {
        "importedAt": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        "source": "Simon PDFs (local)",
        "count": len(topics),
        "breakdown": {
            "task2": sum(1 for t in topics if t["task"] == "task2" and t.get("contentKind") == "model"),
            "ideas": sum(1 for t in topics if t.get("source") == "simon-ideas"),
        },
        "topics": topics,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(bank, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {bank['count']} entries to {OUT}")


if __name__ == "__main__":
    main()
