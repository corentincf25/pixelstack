"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { useProjectActivity } from "./ProjectActivityProvider";

type Counts = {
  messagesCount: number;
  versionsCount: number;
  assetsCount: number;
  referencesCount: number;
};

type Props = {
  projectId: string;
  initialCounts: Counts;
  /** Timestamp du dernier envoi/action par l'utilisateur courant : on n'affiche pas le bandeau si la variation a eu lieu juste après. */
  lastOwnActionAt?: number;
  /** Pendant cette durée (ms) après lastOwnActionAt, on considère que la nouvelle activité vient de nous et on n'affiche pas le bandeau. */
  suppressIfOwnActionWithinMs?: number;
};

function sameCounts(a: Counts, b: Counts) {
  return (
    a.messagesCount === b.messagesCount &&
    a.versionsCount === b.versionsCount &&
    a.assetsCount === b.assetsCount &&
    a.referencesCount === b.referencesCount
  );
}

export function ProjectActivityBanner({
  projectId,
  initialCounts,
  lastOwnActionAt = 0,
  suppressIfOwnActionWithinMs = 18_000,
}: Props) {
  const router = useRouter();
  const { requestRefresh } = useProjectActivity() ?? {};
  const [showBanner, setShowBanner] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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
      if (!counts || sameCounts(counts, baseline)) return;
      const now = Date.now();
      const isLikelyOwnAction = lastOwnActionAt > 0 && now - lastOwnActionAt < suppressIfOwnActionWithinMs;
      if (isLikelyOwnAction) {
        setBaseline(counts);
        return;
      }
      setShowBanner(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [projectId, baseline, fetchCounts, lastOwnActionAt, suppressIfOwnActionWithinMs]);

  const handleRefresh = async () => {
    setRefreshing(true);
    requestRefresh?.();
    router.refresh();
    try {
      const [counts] = await Promise.all([
        fetchCounts(),
        new Promise((r) => setTimeout(r, 600)),
      ]);
      if (counts) setBaseline(counts);
    } finally {
      setShowBanner(false);
      setRefreshing(false);
    }
  };

  if (!showBanner) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-200">
      <span>Nouvelle activité sur le projet.</span>
      <button
        type="button"
        onClick={handleRefresh}
        disabled={refreshing}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-amber-500/20 px-3 py-2 font-medium hover:bg-amber-500/30 disabled:opacity-70"
      >
        <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        {refreshing ? "Chargement…" : "Mettre à jour"}
      </button>
    </div>
  );
}
