"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

type Counts = {
  messagesCount: number;
  versionsCount: number;
  assetsCount: number;
  referencesCount: number;
};

type Props = {
  projectId: string;
  initialCounts: Counts;
};

function sameCounts(a: Counts, b: Counts) {
  return (
    a.messagesCount === b.messagesCount &&
    a.versionsCount === b.versionsCount &&
    a.assetsCount === b.assetsCount &&
    a.referencesCount === b.referencesCount
  );
}

export function ProjectActivityBanner({ projectId, initialCounts }: Props) {
  const router = useRouter();
  const [showBanner, setShowBanner] = useState(false);
  const [baseline, setBaseline] = useState<Counts>(initialCounts);

  useEffect(() => {
    setBaseline(initialCounts);
  }, [
    initialCounts.messagesCount,
    initialCounts.versionsCount,
    initialCounts.assetsCount,
    initialCounts.referencesCount,
  ]);

  const fetchCounts = useCallback(async (): Promise<Counts | null> => {
    try {
      const res = await fetch(`/api/projects/${projectId}/activity-counts`, { credentials: "include" });
      if (!res.ok) return null;
      const data = await res.json();
      return {
        messagesCount: data.messagesCount ?? 0,
        versionsCount: data.versionsCount ?? 0,
        assetsCount: data.assetsCount ?? 0,
        referencesCount: data.referencesCount ?? 0,
      };
    } catch {
      return null;
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    const interval = setInterval(async () => {
      const counts = await fetchCounts();
      if (counts && !sameCounts(counts, baseline)) setShowBanner(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [projectId, baseline, fetchCounts]);

  const handleRefresh = async () => {
    const counts = await fetchCounts();
    if (counts) setBaseline(counts);
    setShowBanner(false);
    router.refresh();
  };

  if (!showBanner) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-200">
      <span>Nouvelle activité sur le projet.</span>
      <button
        type="button"
        onClick={handleRefresh}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-amber-500/20 px-3 py-2 font-medium hover:bg-amber-500/30"
      >
        <RefreshCw className="h-4 w-4" />
        Mettre à jour
      </button>
    </div>
  );
}
