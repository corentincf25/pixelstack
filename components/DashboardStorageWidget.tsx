"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { HardDrive } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const DEFAULT_LIMIT = 1 * 1024 * 1024 * 1024; // 1 Go

function formatBytes(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} Go`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} Mo`;
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(1)} Ko`;
  return `${bytes} o`;
}

const PIE_COLORS = ["#6366f1", "#475569", "#8b5cf6"];

export function DashboardStorageWidget() {
  const [used, setUsed] = useState<number>(0);
  const [limit, setLimit] = useState<number>(DEFAULT_LIMIT);
  const [assetsBytes, setAssetsBytes] = useState<number>(0);
  const [versionsBytes, setVersionsBytes] = useState<number>(0);
  const [refsBytes, setRefsBytes] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data: res, error: err } = await supabase.rpc("get_designer_storage_breakdown");
      if (!mounted) return;
      setLoading(false);
      if (err) {
        const fallback = await supabase.rpc("get_designer_storage");
        const fallbackRaw = Array.isArray(fallback.data) ? fallback.data[0] : fallback.data;
        if (fallbackRaw && typeof fallbackRaw === "object" && "used" in fallbackRaw) {
          setUsed(Number((fallbackRaw as { used: number }).used));
          setLimit(Number((fallbackRaw as { limit: number }).limit) || DEFAULT_LIMIT);
        }
        setError(!!err);
        return;
      }
      const raw = Array.isArray(res) ? res[0] : res;
      const r = raw && typeof raw === "object" ? raw as Record<string, unknown> : null;
      if (r) {
        setUsed(Number(r.used ?? 0));
        setLimit(Number(r.limit ?? DEFAULT_LIMIT));
        setAssetsBytes(Number(r.assets_bytes ?? 0));
        setVersionsBytes(Number(r.versions_bytes ?? 0));
        setRefsBytes(Number((r as { refs_bytes?: number }).refs_bytes ?? 0));
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const percent = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const pieData = [
    { name: "Assets", value: assetsBytes, color: PIE_COLORS[0] },
    { name: "Versions", value: versionsBytes, color: PIE_COLORS[1] },
    { name: "Références", value: refsBytes, color: PIE_COLORS[2] },
  ].filter((d) => d.value > 0);

  return (
    <Link
      href="/dashboard/storage"
      className="glass-card block h-full rounded-2xl border border-white/10 p-4 transition-colors hover:border-primary/30 sm:p-5"
    >
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <HardDrive className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Mon stockage</h3>
      </div>
      {loading ? (
        <div className="mt-4 h-20 animate-pulse rounded-lg bg-muted/30" />
      ) : (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-h-[80px] w-full flex-1 sm:max-w-[100px]">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={80}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={22}
                    outerRadius={34}
                    paddingAngle={2}
                    dataKey="value"
                    isAnimationActive
                    animationDuration={800}
                    animationBegin={200}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="rgba(0,0,0,0.2)" strokeWidth={1} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatBytes(v)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[80px] items-center justify-center rounded-lg bg-muted/20 text-xs text-muted-foreground">
                Vide
              </div>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-base font-semibold tabular-nums text-foreground">
              {formatBytes(used)} <span className="text-sm font-normal text-muted-foreground">/ {formatBytes(limit)}</span>
            </p>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
            {error && (
              <p className="text-xs text-amber-500">Détail indisponible — voir page Stockage</p>
            )}
          </div>
        </div>
      )}
      <p className="mt-2 text-xs text-muted-foreground">Cliquer pour gérer le stockage</p>
    </Link>
  );
}
