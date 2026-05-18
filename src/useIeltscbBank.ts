import { useEffect, useState } from "react";
import { Topic } from "./data";

type IeltscbTask1Bank = {
  fetchedAt: string;
  source: string;
  count: number;
  task: "task1";
  topics: Topic[];
};

/** 仅加载 ielts机考 小作文（Task 1）题库 */
export function useIeltscbBank() {
  const [bankTopics, setBankTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ count: number; source: string } | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`${import.meta.env.BASE_URL}data/ieltscb-task1.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<IeltscbTask1Bank>;
      })
      .then((bank) => {
        if (cancelled) return;
        const topics = bank.topics
          .filter((t) => t.task === "task1")
          .map((t) => ({
            ...t,
            task: "task1" as const,
            contentKind: t.contentKind ?? "exam"
          }));
        setBankTopics(topics);
        setMeta({ count: bank.count ?? topics.length, source: bank.source });
        setError(null);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setBankTopics([]);
        setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { bankTopics, loading, error, meta };
}
