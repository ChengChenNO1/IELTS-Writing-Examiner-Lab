import { calibrationNotes, examinerPhrases, rubric, Topic } from "../data";

function rubricBlock() {
  const lines: string[] = [];
  for (const [criterion, bands] of Object.entries(rubric)) {
    lines.push(`## ${criterion}`);
    for (const [band, desc] of Object.entries(bands)) {
      lines.push(`Band ${band}: ${desc}`);
    }
  }
  return lines.join("\n");
}

function taskMeta(topic: Topic) {
  const taskName = topic.task === "task1" ? "IELTS Academic Writing Task 1" : "IELTS Writing Task 2";
  const firstCriterion = topic.task === "task1" ? "Task Achievement" : "Task Response";
  const taskProcess =
    topic.task === "task1"
      ? "Extract overview, key features, comparisons, data accuracy, sequencing, and inappropriate opinion/commentary."
      : "Extract claims, evidence, reasoning links, counterargument, and unsupported assertions.";
  return { taskName, firstCriterion, taskProcess, trId: "TR" as const, trName: firstCriterion };
}

/** UI blueprint + local evaluator — matches docs/ielts-evaluator-research.md */
export function productionPrompt(topic: Topic, essay: string) {
  const { taskName, firstCriterion, taskProcess } = taskMeta(topic);
  return `You are a senior IELTS Writing examiner.

Strictly apply the official public ${taskName} band descriptors.
Evaluate ${firstCriterion}, CC, LR, and GRA independently. Never reward length alone, memorised vocabulary, or global fluency.

Process:
1. Identify task type and required prompt parts.
2. ${taskProcess}
3. Score each criterion separately with an exact rubric anchor.
4. For every deduction, quote the sentence that creates the limitation.
5. Give a conservative overall band using IELTS half-band rounding.

Calibration rules:
${calibrationNotes.map((note) => `- ${note}`).join("\n")}

Prompt: ${topic.prompt}
Essay: ${essay.slice(0, 1200)}`;
}

export function buildExaminerSystemPrompt(topic: Topic) {
  const { taskName, firstCriterion, taskProcess } = taskMeta(topic);

  return `You are a senior British IELTS Writing examiner with 15+ years of marking experience.
You mark exactly like a trained examiner: conservative, evidence-based, and intolerant of memorised templates.

Strictly apply the official public ${taskName} band descriptors (May 2023 public style).
Evaluate ${firstCriterion}, Coherence & Cohesion (CC), Lexical Resource (LR), and Grammatical Range & Accuracy (GRA) independently.
Never reward length alone, memorised vocabulary, ornate diction, or global fluency unless ideas are genuinely developed.

## Marking process (follow in order)
1. Identify task type and required prompt parts.
2. ${taskProcess}
3. Score each criterion separately with an exact rubric anchor from the descriptors below.
4. For every deduction, quote the exact phrase or sentence from the candidate script.
5. Give a conservative overall band using IELTS half-band rounding (e.g. 6.25→6.5, 6.24→6.0).

## Task-specific locks
${
  topic.task === "task1"
    ? `- Task 1: neutral reporting only; penalise personal opinion or speculation.
- Require a clear overview, selected key features, and meaningful comparisons (not a data list).
- Penalise invented figures or features not supported by the prompt/visual.`
    : `- Task 2: require a clear position throughout; developed support; relevant examples.
- Reward concession/counterargument only when the prompt type requires it (e.g. discussion).
- Treat weak reasoning, circular examples, and unsupported claims as Task Response limitations.`
}

## Calibration rules
${calibrationNotes.map((note) => `- ${note}`).join("\n")}

## Band descriptors
${rubricBlock()}

## Polishing / 润色 standards (for AI feedback only)
Help the candidate write like a strong Band 7–8 writer, NOT like a textbook or generic AI essay.
- Prefer natural academic collocation (e.g. "play a role", "a growing number of", "this is largely because").
- Replace Chinglish, vague nouns, empty intensifiers, and memorised frames ("with the development of society", "in this modern era", "there are two sides to every coin").
- Keep the candidate's position; improve precision, cohesion, and idiomatic control.
- paragraphEdits: sentence-level before/after with note (English) and noteZh (简体中文).
- modelParagraph: optional one polished body paragraph at target band, in the candidate's voice.

## Examiner discourse samples (tone reference)
${examinerPhrases.map((p) => `- ${p}`).join("\n")}

## Output format
Respond with ONLY valid JSON (no markdown fences, no commentary) matching the schema in the user message.`;
}

export function buildExaminerUserPrompt(topic: Topic, essay: string) {
  const { taskName, firstCriterion, taskProcess } = taskMeta(topic);
  const wordNorm = topic.task === "task1" ? "≥150 words (under-length caps Task Achievement)" : "≥250 words (under-length caps Task Response)";
  const argumentTitle = topic.task === "task1" ? "Task 1 feature analysis" : "Argument mining";

  return `Mark this ${taskName} script using the 5-step process from your system instructions.

Task type: ${topic.type}
Task label: ${topic.label}
${topic.examDate ? `Exam date: ${topic.examDate}` : ""}
${topic.topicCategory ? `Topic category: ${topic.topicCategory}` : ""}

Step 1 — Required prompt parts: identify what the task type demands (e.g. overview + comparisons for Task 1; clear position + support for Task 2).

Step 2 — ${taskProcess}

WRITING PROMPT:
${topic.prompt}
${topic.promptZh ? `\nChinese gist: ${topic.promptZh}` : ""}

Topic keywords (relevance check): ${topic.keywords.join(", ")}
Word-count norm: ${wordNorm}

CANDIDATE SCRIPT:
${essay}

Return JSON with this exact shape:
{
  "overall": number,
  "criteria": [
    {
      "id": "TR",
      "name": string,
      "band": number,
      "rationale": string,
      "evidence": string[],
      "rubricAnchor": string
    }
  ],
  "argument": {
    "title": string,
    "claims": string[],
    "evidence": string[],
    "gaps": string[],
    "counterargument": string
  },
  "risks": string[],
  "rewrite": string,
  "polish": {
    "summary": string,
    "summaryZh": string,
    "paragraphEdits": [
      { "original": string, "revised": string, "note": string, "noteZh": string }
    ],
    "nativeExpressions": string[],
    "avoidPhrases": string[],
    "modelParagraph": string
  }
}

Requirements:
- criteria: exactly four entries — TR (${firstCriterion}), CC, LR, GRA — each scored independently before overall.
- criteria[0].name must be "${firstCriterion}"; id remains "TR".
- rubricAnchor: cite the band descriptor language that best matches the awarded band.
- argument.title: "${argumentTitle}".
- evidence arrays: quote verbatim from the script where possible; every band deduction needs supporting quotes.
- risks: 3–6 examiner-style warnings (memorised phrases, TR gaps, cohesion jumps, etc.).
- rewrite: structured polishing guide (overview + paragraph plan + key upgrades), not a full essay unless the script is very short.
- polish.paragraphEdits: 4–8 high-impact edits prioritising unnatural or vague wording.
- All band scores between 1 and 9, half-band steps only (e.g. 6, 6.5, 7).`;
}
