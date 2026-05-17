import { Sparkles } from "lucide-react";
import { Evaluation } from "../evaluator";

export function PolishPanel({ evaluation }: { evaluation: Evaluation }) {
  const polish = evaluation.polish;
  if (!polish) return null;

  return (
    <section className="panel polish-panel">
      <div className="section-title">
        <Sparkles size={18} />
        <h2>AI 润色反馈</h2>
      </div>
      {polish.summary && <p>{polish.summary}</p>}
      {polish.summaryZh && <p className="prompt-zh">{polish.summaryZh}</p>}

      {polish.paragraphEdits.length > 0 && (
        <div className="polish-edits">
          <h3>逐句润色</h3>
          {polish.paragraphEdits.map((edit) => (
            <article className="polish-edit" key={`${edit.original}-${edit.revised}`}>
              <blockquote className="polish-original">{edit.original}</blockquote>
              <blockquote className="polish-revised">{edit.revised}</blockquote>
              {edit.note && <p className="polish-note">{edit.note}</p>}
              {edit.noteZh && <p className="prompt-zh">{edit.noteZh}</p>}
            </article>
          ))}
        </div>
      )}

      {polish.nativeExpressions.length > 0 && (
        <div>
          <h3>地道表达</h3>
          <div className="phrase-list">
            {polish.nativeExpressions.map((phrase) => (
              <span key={phrase}>{phrase}</span>
            ))}
          </div>
        </div>
      )}

      {polish.avoidPhrases.length > 0 && (
        <div>
          <h3>建议避免</h3>
          <div className="phrase-list avoid">
            {polish.avoidPhrases.map((phrase) => (
              <span key={phrase}>{phrase}</span>
            ))}
          </div>
        </div>
      )}

      {polish.modelParagraph && (
        <div>
          <h3>范文段落参考</h3>
          <pre className="rewrite">{polish.modelParagraph}</pre>
        </div>
      )}
    </section>
  );
}
