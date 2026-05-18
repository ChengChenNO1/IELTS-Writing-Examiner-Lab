import { useEffect, useState } from "react";
import { Topic } from "./data";

type SimonBank = {
  importedAt: string;
  source: string;
  count: number;
  topics: Topic[];
};

export function useSimonBank() {
  const [bankTopics, setBankTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ count: number; source: string } | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`${import.meta.env.BASE_URL}data/simon-essays.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<SimonBank>;
      })
      .then((bank) => {
        if (cancelled) return;
        setBankTopics(bank.topics);
        setMeta({ count: bank.count ?? bank.topics.length, source: bank.source });
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
