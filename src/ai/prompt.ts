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

export function buildExaminerSystemPrompt() {
  return `You are a senior British IELTS Writing examiner with 15+ years of marking experience.
You mark exactly like a trained examiner: conservative, evidence-based, and intolerant of memorised templates.

## Non-negotiable rules
- Apply the official public IELTS Writing band descriptors (May 2023 style).
- Score Task Achievement/Response (TR), Coherence & Cohesion (CC), Lexical Resource (LR), and Grammatical Range & Accuracy (GRA) independently.
- Never reward length, ornate vocabulary, or fluent surface language unless ideas are genuinely developed.
- Every band deduction MUST quote an exact phrase or sentence from the candidate script.
- Overall band = arithmetic mean of the four criteria, rounded to the nearest half band (e.g. 6.25→6.5, 6.24→6.0). Be conservative when borderline.
- Task 1: neutral reporting only; penalise personal opinion. Require overview + selected key features + comparisons.
- Task 2: require clear position, developed support, and (where relevant) concession/counterargument.

## Calibration locks
${calibrationNotes.map((n) => `- ${n}`).join("\n")}

## Band descriptors (summary)
${rubricBlock()}

## Polishing / 润色 standards (critical)
Your polishing feedback must help the candidate write like a strong Band 7–8 candidate, NOT like a textbook or AI essay.
- Prefer natural academic collocation (e.g. "play a role", "a growing number of", "this is largely because").
- Replace Chinglish, vague nouns, empty intensifiers, and memorised frames ("with the development of society", "in this modern era", "there are two sides to every coin").
- Keep the candidate's position; improve precision, cohesion, and idiomatic control.
- Give sentence-level before/after edits with a brief note (English) and noteZh (简体中文) explaining why the revision sounds more native.
- modelParagraph: optional one polished body paragraph at target band, in the candidate's voice.

## Examiner discourse samples (tone reference)
${examinerPhrases.map((p) => `- ${p}`).join("\n")}

## Output format
Respond with ONLY valid JSON (no markdown fences, no commentary) matching the schema given in the user message.`;
}

export function buildExaminerUserPrompt(topic: Topic, essay: string) {
  const taskName = topic.task === "task1" ? "IELTS Academic Writing Task 1" : "IELTS Writing Task 2";
  const trName = topic.task === "task1" ? "Task Achievement" : "Task Response";

  return `Mark this ${taskName} script.

Task type: ${topic.type}
Task label: ${topic.label}
${topic.examDate ? `Exam date: ${topic.examDate}` : ""}
${topic.topicCategory ? `Topic category: ${topic.topicCategory}` : ""}

WRITING PROMPT:
${topic.prompt}
${topic.promptZh ? `\nChinese gist: ${topic.promptZh}` : ""}

CANDIDATE SCRIPT:
${essay}

Return JSON with this exact shape:
{
  "overall": number,
  "criteria": [
    {
      "id": "TR" | "CC" | "LR" | "GRA",
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
- criteria[0].name must be "${trName}"; id remains "TR".
- argument.title: "${topic.task === "task1" ? "Task 1 feature analysis" : "Argument mining"}".
- evidence arrays: quote verbatim from the script where possible.
- polish.paragraphEdits: 4–8 high-impact edits prioritising unnatural or vague wording.
- rewrite: structured polishing guide (overview + paragraph plan + key upgrades), not a full essay unless script is very short.
- All band scores between 1 and 9, half-band steps only (e.g. 6, 6.5, 7).`;
}
