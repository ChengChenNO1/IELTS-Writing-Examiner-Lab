import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart2,
  BarChart3,
  BookOpen,
  CheckCircle2,
  FileText,
  GraduationCap,
  LineChart,
  Map,
  PieChart,
  RotateCcw,
  Sparkles,
  Table2,
  Workflow
} from "lucide-react";
import { calibrationNotes, examinerPhrases, topics } from "./data";
import { Topic } from "./data";
import { ApiSettingsPanel } from "./ai/ApiSettingsPanel";
import { isAiReady, loadAiConfig, resolveEffectiveConfig, type AiConfig } from "./ai/config";
import { evaluateEssayWithAi } from "./ai/evaluateWithAi";
import { PolishPanel } from "./components/PolishPanel";
import { Evaluation, essaySurfaceStats, evaluateEssay } from "./evaluator";
import { resolveTask1Visual } from "./task1/resolveVisual";
import { Task1Visual } from "./task1/Task1Visual";
import { useTask1Bank } from "./task1/useTask1Bank";
import { useYanyihannBank } from "./useYanyihannBank";

const sampleTask2 = `Artificial intelligence is already changing education, and I believe it can improve learning if schools use it carefully. Some people are worried that students will become too dependent on machines, but the benefits are stronger when teachers remain in control.

On the one hand, AI tools can create problems. For example, students may copy answers from a chatbot instead of developing their own ideas. This is especially dangerous in writing classes because the final text can look fluent even when the student has not understood the topic. Schools therefore need clear rules and assessment methods that still require personal thinking.

On the other hand, AI can make education more personal. A teacher with thirty students cannot always give detailed feedback to everyone, but an AI system can identify grammar mistakes, weak examples, and unclear organisation immediately. This does not replace the teacher; it gives the teacher more time to explain difficult ideas and help weaker learners.

In conclusion, artificial intelligence is a positive development in education as long as it is treated as a support tool rather than a substitute for learning. The main priority should be teaching students how to use it responsibly.`;

const sampleTask1 = `The line graph compares energy production from coal, natural gas and renewable sources in a country between 2000 and 2020.

Overall, coal production declined steadily over the period, while renewable energy increased and became a much more significant source by the end of the timeframe. Natural gas showed a more moderate rise, although it remained below coal for much of the period.

At the beginning, coal was the dominant source of energy. Its figure then fell gradually, with the sharpest decrease occurring after 2010. By contrast, renewable energy started from a relatively low level but rose consistently throughout the twenty-year period.

Natural gas also increased, but the change was less dramatic than the growth in renewables. By 2020, the gap between the three sources had narrowed, showing a clear shift away from coal and towards cleaner energy sources.`;

function sampleForTask(task: Topic["task"]) {
  return task === "task1" ? sampleTask1 : sampleTask2;
}

function BandBadge({ value }: { value: number }) {
  return <span className="band-badge">Band {value.toFixed(value % 1 ? 1 : 0)}</span>;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function task1TypeIcon(type: Topic["type"]) {
  switch (type) {
    case "line graph":
      return <LineChart size={16} />;
    case "bar chart":
      return <BarChart2 size={16} />;
    case "pie chart":
      return <PieChart size={16} />;
    case "table":
      return <Table2 size={16} />;
    case "map":
      return <Map size={16} />;
    case "process":
      return <Workflow size={16} />;
    default:
      return <BarChart2 size={16} />;
  }
}

function CriteriaPanel({ evaluation }: { evaluation: Evaluation }) {
  return (
    <section className="panel criteria-panel">
      <div className="section-title">
        <BarChart3 size={18} />
        <h2>Trait scoring</h2>
      </div>
      <div className="criteria-grid">
        {evaluation.criteria.map((criterion) => (
          <article className="criterion" key={criterion.id}>
            <div className="criterion-head">
              <div>
                <span className="criterion-id">{criterion.id}</span>
                <h3>{criterion.name}</h3>
              </div>
              <BandBadge value={criterion.band} />
            </div>
            <p>{criterion.rationale}</p>
            <div className="evidence">
              <strong>Evidence</strong>
              {criterion.evidence.map((item) => (
                <blockquote key={item}>{item}</blockquote>
              ))}
            </div>
            <div className="rubric-anchor">{criterion.rubricAnchor}</div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ArgumentPanel({ evaluation }: { evaluation: Evaluation }) {
  return (
    <section className="panel">
      <div className="section-title">
        <FileText size={18} />
        <h2>{evaluation.argument.title}</h2>
      </div>
      <div className="argument-grid">
        <div>
          <h3>{evaluation.argument.title === "Task 1 feature analysis" ? "Key features" : "Claims"}</h3>
          {evaluation.argument.claims.length ? evaluation.argument.claims.map((claim) => <p key={claim}>{claim}</p>) : <p>No strong feature or claim detected.</p>}
        </div>
        <div>
          <h3>{evaluation.argument.title === "Task 1 feature analysis" ? "Data / detail" : "Support"}</h3>
          {evaluation.argument.evidence.length ? evaluation.argument.evidence.map((item) => <p key={item}>{item}</p>) : <p>No specific detail or evidence detected.</p>}
        </div>
        <div>
          <h3>Gaps</h3>
          {evaluation.argument.gaps.map((gap) => <p key={gap}>{gap}</p>)}
        </div>
        <div>
          <h3>Counterargument</h3>
          <p>{evaluation.argument.counterargument}</p>
        </div>
      </div>
    </section>
  );
}

function topicBadge(item: Topic) {
  if (item.source === "custom") return "custom";
  if (item.source === "external") return "web";
  if (item.source === "yanyihann") return "真题";
  return item.type;
}

function App() {
  const { externalTopics, loading: bankLoading } = useTask1Bank();
  const { bankTopics: yanyihannTopics, loading: yhLoading, meta: yhMeta } = useYanyihannBank();
  const [activeTask, setActiveTask] = useState<Topic["task"]>("task2");
  const [customTopics, setCustomTopics] = useState<Topic[]>([]);
  const [topicId, setTopicId] = useState("ai-education");
  const [essay, setEssay] = useState(sampleTask2);
  const [history, setHistory] = useState<number[]>([]);
  const [customLabel, setCustomLabel] = useState("");
  const [customType, setCustomType] = useState<Topic["type"]>("opinion");
  const [customPrompt, setCustomPrompt] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [aiConfig, setAiConfig] = useState<AiConfig>(() => loadAiConfig());
  const [scoredEvaluation, setScoredEvaluation] = useState<Evaluation | null>(null);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);

  const allTopics = useMemo(() => {
    const builtin = topics.filter((item) => item.task === activeTask);
    const yh = activeTask === "task2" ? yanyihannTopics : [];
    const ext = activeTask === "task1" ? externalTopics : [];
    const custom = customTopics.filter((item) => item.task === activeTask);
    return [...builtin, ...yh, ...ext, ...custom];
  }, [activeTask, yanyihannTopics, externalTopics, customTopics]);

  const yearOptions = useMemo(() => {
    const years = new Set<number>();
    for (const item of yanyihannTopics) {
      if (item.year) years.add(item.year);
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [yanyihannTopics]);

  const categoryOptions = useMemo(() => {
    const cats = new Set<string>();
    for (const item of yanyihannTopics) {
      if (item.topicCategory) cats.add(item.topicCategory);
    }
    return Array.from(cats).sort((a, b) => a.localeCompare(b));
  }, [yanyihannTopics]);

  const filteredTopics = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allTopics.filter((item) => {
      if (yearFilter && item.year !== Number(yearFilter)) return false;
      if (categoryFilter && item.topicCategory !== categoryFilter) return false;
      if (!q) return true;
      const haystack = [item.label, item.prompt, item.promptZh ?? "", item.topicCategory ?? ""].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [allTopics, searchQuery, yearFilter, categoryFilter]);

  const topic = allTopics.find((item) => item.id === topicId) ?? filteredTopics[0] ?? topics[0];
  const task1Visual = useMemo(() => resolveTask1Visual(topic), [topic]);
  const localPreview = useMemo(() => evaluateEssay(topic, essay), [topic, essay]);
  const surface = useMemo(() => essaySurfaceStats(essay), [essay]);
  const evaluation = scoredEvaluation ?? localPreview;
  const aiReady = isAiReady(aiConfig);

  useEffect(() => {
    setScoredEvaluation(null);
    setEvalError(null);
  }, [essay, topicId]);

  async function scoreNow() {
    setEvalError(null);

    if (aiReady) {
      setEvalLoading(true);
      try {
        const result = await evaluateEssayWithAi(topic, essay, aiConfig);
        setScoredEvaluation(result);
        setHistory((items) => [result.overall, ...items].slice(0, 6));
      } catch (err) {
        const message = err instanceof Error ? err.message : "AI 阅卷失败";
        setEvalError(message);
      } finally {
        setEvalLoading(false);
      }
      return;
    }

    const result = evaluateEssay(topic, essay);
    setScoredEvaluation(result);
    setHistory((items) => [result.overall, ...items].slice(0, 6));
  }

  function chooseTask(task: Topic["task"]) {
    setActiveTask(task);
    setSearchQuery("");
    setYearFilter("");
    setCategoryFilter("");
    const next =
      topics.find((item) => item.task === task) ??
      (task === "task2" ? yanyihannTopics[0] : externalTopics[0]) ??
      customTopics.find((item) => item.task === task);
    if (next) {
      setTopicId(next.id);
      setEssay(sampleForTask(task));
      setHistory([]);
      setCustomType(task === "task1" ? "line graph" : "opinion");
    }
  }

  function chooseTopic(next: Topic) {
    setTopicId(next.id);
    setEssay(sampleForTask(next.task));
    setHistory([]);
  }

  function addCustomTask() {
    const prompt = customPrompt.trim();
    if (!prompt) return;
    const label = customLabel.trim() || `Custom ${activeTask === "task1" ? "Task 1" : "Task 2"}`;
    const keywords = Array.from(new Set(prompt.toLowerCase().match(/[a-z]+/g)?.filter((word) => word.length > 3).slice(0, 10) ?? ["custom"]));
    const customTopic: Topic = {
      id: `custom-${Date.now()}`,
      label,
      task: activeTask,
      type: customType,
      prompt,
      keywords,
      source: "custom"
    };
    setCustomTopics((items) => [...items, customTopic]);
    setTopicId(customTopic.id);
    setEssay("");
    setHistory([]);
    setCustomLabel("");
    setCustomPrompt("");
  }

  return (
    <main className="app-shell">
      <aside className="left-rail">
        <div className="brand">
          <GraduationCap size={26} />
          <div>
            <h1>IELTS Examiner Lab</h1>
            <span>Rubric-locked writing evaluation</span>
          </div>
        </div>

        <section className="panel topic-panel">
          <div className="section-title">
            <BookOpen size={18} />
            <h2>Choose a task</h2>
          </div>
          <div className="task-switch" role="tablist" aria-label="Writing task">
            <button className={activeTask === "task1" ? "active" : ""} onClick={() => chooseTask("task1")}>
              Task 1
            </button>
            <button className={activeTask === "task2" ? "active" : ""} onClick={() => chooseTask("task2")}>
              Task 2
            </button>
          </div>
          {activeTask === "task2" && (
            <div className="topic-filters">
              <input
                className="topic-search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="搜索题目（中英文）"
              />
              <div className="filter-row">
                <select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)}>
                  <option value="">全部年份</option>
                  {yearOptions.map((year) => (
                    <option key={year} value={String(year)}>
                      {year}
                    </option>
                  ))}
                </select>
                <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                  <option value="">全部话题</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <p className="bank-status">
                {yhLoading
                  ? "正在加载 yanyihann 真题库…"
                  : yhMeta
                    ? `真题 ${yhMeta.count} 题 · 显示 ${filteredTopics.length} 题`
                    : "运行 npm run fetch:yanyihann 可更新真题库"}
              </p>
            </div>
          )}
          <div className="topic-list">
            {filteredTopics.length ? (
              filteredTopics.map((item) => (
                <button className={item.id === topicId ? "topic active" : "topic"} key={item.id} onClick={() => chooseTopic(item)}>
                  <span className="topic-label">
                    {item.task === "task1" && <span className="topic-type-icon">{task1TypeIcon(item.type)}</span>}
                    <strong>{item.label}</strong>
                  </span>
                  <span>{topicBadge(item)}</span>
                </button>
              ))
            ) : (
              <p className="bank-status">没有匹配的题目，请调整搜索或筛选。</p>
            )}
          </div>
          {activeTask === "task1" && bankLoading && <p className="bank-status">Loading external practice charts…</p>}
          <p className="prompt-text">{topic.prompt}</p>
          {topic.promptZh && <p className="prompt-text prompt-zh">{topic.promptZh}</p>}
          {topic.topicCategory && topic.source === "yanyihann" && (
            <p className="bank-status">
              {topic.year ? `${topic.year} · ` : ""}
              {topic.examDate ? `${topic.examDate} · ` : ""}
              {topic.topicCategory}
            </p>
          )}
          {topic.views && topic.views.length > 0 && (
            <section className="views-panel">
              <h3>参考观点（来自真题库）</h3>
              {topic.views.map((view) => (
                <article className="view-card" key={`${view.side}-${view.claimZh ?? view.claimEn}`}>
                  {view.side && <span className="view-side">{view.side}</span>}
                  {view.claimZh && <p>{view.claimZh}</p>}
                  {view.claimEn && <p className="bank-status">{view.claimEn}</p>}
                  {view.analysisZh && <p>{view.analysisZh}</p>}
                </article>
              ))}
            </section>
          )}
          {task1Visual && (
            <section className="task1-visual-panel" aria-label="Task 1 chart or diagram">
              <Task1Visual visual={task1Visual} />
              {topic.source === "external" && topic.sourceUrl && (
                <p className="visual-source">Chart source: {topic.sourceUrl}</p>
              )}
            </section>
          )}
        </section>

        <section className="panel custom-task">
          <h2>Add custom task</h2>
          <input value={customLabel} onChange={(event) => setCustomLabel(event.target.value)} placeholder="Task title" />
          <select value={customType} onChange={(event) => setCustomType(event.target.value as Topic["type"])}>
            {activeTask === "task1" ? (
              <>
                <option value="line graph">Line graph</option>
                <option value="bar chart">Bar chart</option>
                <option value="pie chart">Pie chart</option>
                <option value="table">Table</option>
                <option value="map">Map</option>
                <option value="process">Process</option>
              </>
            ) : (
              <>
                <option value="opinion">Opinion</option>
                <option value="discussion">Discussion</option>
                <option value="advantages">Advantages</option>
                <option value="problem-solution">Problem-solution</option>
              </>
            )}
          </select>
          <textarea className="custom-prompt" value={customPrompt} onChange={(event) => setCustomPrompt(event.target.value)} placeholder="Paste or type your IELTS writing task here." />
          <button className="ghost add-task" onClick={addCustomTask}>Add and write</button>
        </section>

        <ApiSettingsPanel config={aiConfig} onChange={setAiConfig} />

        <section className="panel calibration">
          <div className="section-title">
            <CheckCircle2 size={18} />
            <h2>Calibration locks</h2>
          </div>
          {calibrationNotes.map((note) => (
            <p key={note}>{note}</p>
          ))}
        </section>
      </aside>

      <section className="workspace">
        {topic.task === "task1" && task1Visual && (
          <section className="panel task1-visual-workspace" aria-label="Task 1 visual (writing area)">
            <Task1Visual visual={task1Visual} />
          </section>
        )}
        <div className="editor-head">
          <div>
            <h2>Write your response</h2>
            <p>
              {topic.task === "task1"
                ? "Summarise visual information with an overview, key features, and comparisons."
                : "Draft, score, revise, and score again. The engine separates rubric traits before giving the final band."}
            </p>
          </div>
          <div className="actions">
            <button className="ghost" onClick={() => setEssay(sampleForTask(topic.task))}>
              <RotateCcw size={16} />
              Sample
            </button>
            <button className="primary" onClick={scoreNow} disabled={evalLoading || !essay.trim()}>
              <Sparkles size={16} />
              {evalLoading ? "AI 阅卷中…" : aiReady ? "AI 阅卷" : "本地评分"}
            </button>
          </div>
        </div>
        {evalError && <p className="eval-error">{evalError}</p>}
        <textarea className="essay-input" value={essay} onChange={(event) => setEssay(event.target.value)} spellCheck />
        <div className="metrics-row">
          <Metric label="Words" value={surface.wordCount} />
          <Metric label="Sentences" value={surface.sentenceCount} />
          <Metric label="Paragraphs" value={surface.paragraphCount} />
          <Metric label="Iterations" value={history.length} />
        </div>
      </section>

      <aside className="right-rail">
        <section className="score-card">
          <span>{evaluation.mode === "ai" ? "AI examiner overall" : "Estimated overall"}</span>
          <strong>{evaluation.overall.toFixed(evaluation.overall % 1 ? 1 : 0)}</strong>
          <p>
            {evaluation.mode === "ai"
              ? `Senior examiner model · ${resolveEffectiveConfig(aiConfig).model}${aiConfig.useBuiltin && !aiConfig.apiKey.trim() ? " (builtin)" : ""}`
              : `Local rule-based estimate · enable AI for native polishing`}
          </p>
          <div className="history">
            {history.length ? history.map((item, index) => <span key={`${item}-${index}`}>{item}</span>) : <span>No saved scoring run yet</span>}
          </div>
        </section>

        {evaluation.risks.length > 0 && (
          <section className="panel risk-panel">
            <div className="section-title">
              <AlertTriangle size={18} />
              <h2>Score limiters</h2>
            </div>
            {evaluation.risks.map((risk) => (
              <p key={risk}>{risk}</p>
            ))}
          </section>
        )}

        <CriteriaPanel evaluation={evaluation} />
        <ArgumentPanel evaluation={evaluation} />

        <PolishPanel evaluation={evaluation} />

        <section className="panel">
          <div className="section-title">
            <Sparkles size={18} />
            <h2>{evaluation.mode === "ai" ? "Polishing guide" : "Polishing reference"}</h2>
          </div>
          <pre className="rewrite">{evaluation.rewrite}</pre>
        </section>

        <section className="panel">
          <h2>Examiner discourse</h2>
          <div className="phrase-list">
            {examinerPhrases.map((phrase) => (
              <span key={phrase}>{phrase}</span>
            ))}
          </div>
        </section>

        <details className="prompt-details">
          <summary>Production prompt blueprint</summary>
          <pre>{evaluation.promptBlueprint}</pre>
        </details>
      </aside>
    </main>
  );
}

export default App;
