# IELTS Writing Evaluator Research Notes

## Downloaded source set

All local research files are stored under `research/`.

### Official IELTS / examiner material

- `research/official/ielts-writing-band-descriptors-2023.pdf`
  - Official public band descriptors updated May 2023.
  - Used to structure Task 2 criteria: Task Response, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy.
- `research/official/ielts-writing-key-assessment-criteria.pdf`
  - Official explanation of what each criterion measures.
  - Used to phrase the UI and evaluator around independent traits.
- `research/official/academic-writing-sample-candidate-responses-and-examiner-comments.pdf`
  - Sample candidate responses with examiner comments.
  - Used for examiner-style feedback language.
- `research/official/ielts-academic-writing-example-responses-to-parts-1-and-2-with-band-scores-and-examiner-comments.pdf`
  - IELTS academic writing examples with band scores and comments.
- `research/official/ielts-general-training-writing-example-responses-band-scores-examiner-comments.pdf`
  - General Training examples with band scores and comments.

### AES and LLM scoring

- `research/aes/rethink-aes-agreement-fairness-feedback-doewes-2026.pdf`
  - Thesis on agreement, fairness, reliability, and feedback in AES.
  - Product implication: do not rely on score agreement alone; make feedback actionable and check consistency.
- `research/aes/multi-agent-single-agent-llm-essay-grading-2026.pdf`
  - Paper comparing single-agent and multi-agent LLM essay grading with rubric and few-shot calibration.
  - Product implication: separate scoring dimensions and use calibration examples.

### Argument mining

- `research/argument-mining/argument-mining-survey-lawrence-reed-2019.pdf`
  - Survey on identifying claims, premises, evidence, support, attack, and argument structure.
  - Product implication: IELTS Task Response should inspect claims, support, reasoning links, and counterargument rather than only grammar.

## Link verification notes

The user-provided IELTS Task 2 public PDF URL redirected to an HTML page during download, so the project uses the official May 2023 descriptors PDF instead.

The provided arXiv ID `2305.15081` does not correspond to an essay scoring paper. It appears to point to an unrelated astrophysics preprint, so it was not used as a product source. The implementation instead uses a current LLM essay grading paper that explicitly discusses rubric prompts, few-shot calibration, consistency, and single-agent versus multi-agent architectures.

The Kaggle ASAP dataset page requires Kaggle access/terms and was not downloaded as raw data. The product architecture still reflects the AES lessons typically associated with ASAP work: score distribution, prompt-specific scoring, length bias, and trait-level evaluation.

## Product architecture

The app is intentionally not a chat wrapper. It follows this pipeline:

1. Select IELTS Writing Task 2 topic.
2. Candidate writes or revises an essay.
3. Evaluator extracts surface evidence:
   - word count
   - sentence count
   - paragraph count
   - prompt keyword coverage
   - stance markers
   - support/example markers
   - cohesion markers
   - template-like phrases
   - complex structure markers
4. Evaluator scores each IELTS criterion independently.
5. Evaluator calculates a conservative overall half-band estimate.
6. UI shows:
   - four trait bands
   - exact evidence snippets
   - rubric anchors
   - argument mining panel
   - score limiters
   - polishing reference
   - production prompt blueprint
   - iteration history

## Scoring prompt principles

Production LLM scoring should use a decomposed prompt:

```text
You are a senior IELTS Writing examiner.

Strictly apply the official public IELTS Writing Task 2 band descriptors.
Evaluate TR, CC, LR, and GRA independently. Never reward length alone, memorised vocabulary, or global fluency.

Process:
1. Identify task type and required prompt parts.
2. Extract claims, evidence, reasoning links, counterargument, and unsupported assertions.
3. Score each criterion separately with an exact rubric anchor.
4. For every deduction, quote the sentence that creates the limitation.
5. Give a conservative overall band using IELTS half-band rounding.
```

Calibration rules:

- Score each criterion independently before calculating the overall band.
- Do not reward length, ornate vocabulary, or memorised phrases unless they serve the task naturally.
- Require exact textual evidence for each deduction.
- Treat weak reasoning, circular examples, and unsupported claims as Task Response limitations.
- Use conservative rounding: a polished surface cannot compensate for underdeveloped content.

## Implementation notes

The current app uses a local deterministic evaluator so the page works without API keys. The production prompt blueprint is included in the UI and in `src/evaluator.ts`; it can be wired to an LLM endpoint later without changing the product flow.

## Task coverage update

The app now separates IELTS Academic Writing Task 1 and Writing Task 2.

Task 1 built-in coverage:

- line graph
- bar chart
- pie chart
- table
- map
- process diagram

Task 2 built-in coverage:

- opinion
- discussion
- advantages/disadvantages
- problem-solution

Users can also add a custom task from the left panel. A custom task stores:

- task title
- task number
- task type
- prompt text
- generated keyword anchors for local scoring

The evaluator switches behavior by task:

- Task 1 uses Task Achievement language, checks for overview, selected key features, comparisons, neutral reporting language, and inappropriate opinion language.
- Task 2 uses Task Response language, checks for position, claims, evidence, reasoning links, counterargument/concession, and template-like phrasing.
