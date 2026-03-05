"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type UnreadRow = {
  project_id: string;
  project_title: string;
  new_messages_count: number;
  new_versions_count: number;
  new_feedback_count?: number;
};

export function useUnreadCounts() {
  const [rows, setRows] = useState<UnreadRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data, error } = await supabase.rpc("get_project_unread_counts");
    if (!error && data) setRows((data as UnreadRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const byProject = rows.reduce(
    (acc, r) => {
      acc[r.project_id] = {
        newMessages: Number(r.new_messages_count) || 0,
        newVersions: Number(r.new_versions_count) || 0,
        newFeedback: Number(r.new_feedback_count) ?? 0,
        title: r.project_title,
      };
      return acc;
    },
    {} as Record<string, { newMessages: number; newVersions: number; newFeedback: number; title: string }>
  );

  const totalNew = rows.reduce(
    (acc, r) => ({
      messages: acc.messages + (Number(r.new_messages_count) || 0),
      versions: acc.versions + (Number(r.new_versions_count) || 0),
      feedback: acc.feedback + (Number(r.new_feedback_count) ?? 0),
    }),
    { messages: 0, versions: 0, feedback: 0 }
  );

  return { rows, byProject, totalNew, loading, refresh: load };
}
