import { useEffect, useState } from "react";
import { Topic } from "../data";
import { ExternalTask1Topic, Task1Bank } from "./types";

function toTopic(item: ExternalTask1Topic): Topic {
  return {
    id: item.id,
    label: item.label,
    prompt: item.prompt,
    task: "task1",
    type: normalizeType(item.type),
    keywords: item.keywords,
    source: "external",
    imageUrl: item.imageUrl,
    sourceUrl: item.source
  };
}

function normalizeType(type: string): Topic["type"] {
  const lower = type.toLowerCase();
  if (lower.includes("line")) return "line graph";
  if (lower.includes("bar")) return "bar chart";
  if (lower.includes("pie")) return "pie chart";
  if (lower.includes("table")) return "table";
  if (lower.includes("map")) return "map";
  if (lower.includes("process") || lower.includes("diagram")) return "process";
  return "line graph";
}

export function useTask1Bank() {
  const [externalTopics, setExternalTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`${import.meta.env.BASE_URL}data/task1-external.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<Task1Bank>;
      })
      .then((bank) => {
        if (cancelled) return;
        setExternalTopics(bank.topics.map(toTopic));
        setError(null);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setExternalTopics([]);
        setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { externalTopics, loading, error };
}
