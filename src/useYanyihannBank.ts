import { useEffect, useState } from "react";
import { Topic } from "./data";

type YanyihannBank = {
  fetchedAt: string;
  source: string;
  count: number;
  topics: Topic[];
};

export function useYanyihannBank() {
  const [bankTopics, setBankTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ count: number; source: string } | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`${import.meta.env.BASE_URL}data/yanyihann-writing.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<YanyihannBank>;
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
