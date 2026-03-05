"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { HardDrive } from "lucide-react";

const DEFAULT_LIMIT = 100 * 1024 * 1024; // 100 Mo (plan gratuit)

function formatBytes(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} Go`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} Mo`;
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(1)} Ko`;
  return `${bytes} o`;
}

export function StorageBar() {
  const [data, setData] = useState<{ used: number; limit: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data: res, error } = await supabase.rpc("get_designer_storage");
      if (!mounted) return;
      setLoading(false);
      const raw = Array.isArray(res) ? res[0] : res;
      if (!error && raw && typeof raw === "object" && "used" in raw && "limit" in raw) {
        setData({
          used: Number((raw as { used: number }).used),
          limit: Number((raw as { limit: number }).limit),
        });
      } else {
        setData({ used: 0, limit: DEFAULT_LIMIT });
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const used = data?.used ?? 0;
  const limit = data?.limit ?? DEFAULT_LIMIT;
  const percent = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;

  return (
    <div className="mt-2 space-y-1.5 rounded-lg bg-muted/30 px-3 py-2">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
          <HardDrive className="h-3.5 w-3.5 shrink-0" />
          Stockage
        </span>
        {loading ? (
          <span className="h-4 w-12 animate-pulse rounded bg-muted" />
        ) : (
          <span className="tabular-nums text-muted-foreground">
            {formatBytes(used)} / {formatBytes(limit)}
          </span>
        )}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        {loading ? (
          <div className="h-full w-1/3 animate-pulse rounded-full bg-primary/50" />
        ) : (
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${percent}%` }}
          />
        )}
      </div>
    </div>
  );
}
