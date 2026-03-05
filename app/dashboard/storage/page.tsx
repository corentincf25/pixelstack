"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { HardDrive, ArrowLeft, FolderKanban, Image, Layers, ArrowUpDown, Trash2 } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

type StorageBreakdown = {
  used: number;
  limit: number;
  assets_bytes: number;
  versions_bytes: number;
  refs_bytes?: number;
  projects: Array<{
    project_id: string;
    project_title: string;
    assets_size: number;
    versions_size: number;
    refs_size?: number;
  }>;
};

function formatBytes(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} Go`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} Mo`;
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(1)} Ko`;
  return `${bytes} o`;
}

const CHART_COLORS = [
  "#6366f1", /* primary */
  "#475569",
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#64748b",
];

export default function StoragePage() {
  const router = useRouter();
  const [data, setData] = useState<StorageBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<"designer" | "youtuber" | null>(null);
  const [backfilling, setBackfilling] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [sortBy, setSortBy] = useState<"size_desc" | "size_asc" | "name">("size_desc");
  const [purgeProjectId, setPurgeProjectId] = useState<string | null>(null);
  const [purgeProjectTitle, setPurgeProjectTitle] = useState<string>("");
  const [purging, setPurging] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

      const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "designer") {
      setRole(profile?.role ?? null);
      setLoading(false);
      return;
    }
    setRole("designer");

    const { data: res, error } = await supabase.rpc("get_designer_storage_breakdown");
      const raw = Array.isArray(res) ? res[0] : res;
    if (!error && raw && typeof raw === "object") {
      const r = raw as {
          used?: number;
        limit?: number;
        assets_bytes?: number;
        versions_bytes?: number;
        refs_bytes?: number;
        projects?: StorageBreakdown["projects"];
      };
      setData({
        used: Number(r.used ?? 0),
        limit: Number(r.limit ?? 1 * 1024 * 1024 * 1024),
        assets_bytes: Number(r.assets_bytes ?? 0),
        versions_bytes: Number(r.versions_bytes ?? 0),
        refs_bytes: Number(r.refs_bytes ?? 0),
        projects: Array.isArray(r.projects) ? r.projects : [],
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [refresh]);

  const handleRecalculate = async () => {
    setBackfilling(true);
    try {
      const res = await fetch("/api/storage/backfill", { method: "POST" });
      if (res.ok) {
        setRefresh((r) => r + 1);
      }
    } finally {
      setBackfilling(false);
    }
  };

  const handlePurge = async (projectId: string) => {
    setPurging(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/storage/purge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
      if (res.ok) {
        setPurgeProjectId(null);
        setPurgeProjectTitle("");
        setRefresh((r) => r + 1);
      }
    } finally {
      setPurging(false);
    }
  };

  const projectsSorted = useMemo(() => {
    const list = [...(data?.projects ?? [])];
    list.sort((a, b) => {
      const totalA = Number(a.assets_size ?? 0) + Number(a.versions_size ?? 0) + Number((a as { refs_size?: number }).refs_size ?? 0);
      const totalB = Number(b.assets_size ?? 0) + Number(b.versions_size ?? 0) + Number((b as { refs_size?: number }).refs_size ?? 0);
      const nameA = (a.project_title || "").toLowerCase();
      const nameB = (b.project_title || "").toLowerCase();
      if (sortBy === "size_desc") return totalB - totalA;
      if (sortBy === "size_asc") return totalA - totalB;
      return nameA.localeCompare(nameB);
    });
    return list;
  }, [data?.projects, sortBy]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (role === "youtuber") {
    router.replace("/dashboard");
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  if (role !== "designer") {
    return (
      <div className="rounded-xl glass-card border border-white/10 p-8 text-center">
        <p className="text-muted-foreground">
          Cette page est réservée aux graphistes. Le YouTuber ne dispose pas de stockage : c’est toujours le graphiste qui héberge les fichiers (assets, versions, références) sur son quota, y compris quand c’est le YouTuber qui a créé le projet et t’a invité.
        </p>
        <Link
          href="/dashboard"
          className="btn-interactive mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au dashboard
        </Link>
      </div>
    );
  }

  const used = data?.used ?? 0;
  const limit = data?.limit ?? 1 * 1024 * 1024 * 1024;
  const percent = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const hasNoStorage = used === 0 && (data?.projects?.length ?? 0) === 0;

  const typeData = [
    { name: "Assets (fichiers déposés)", value: data?.assets_bytes ?? 0, color: CHART_COLORS[0] },
    { name: "Versions (miniatures)", value: data?.versions_bytes ?? 0, color: CHART_COLORS[1] },
    { name: "Références (inspirations)", value: data?.refs_bytes ?? 0, color: CHART_COLORS[2] },
  ].filter((d) => d.value > 0);

  const projectData = (data?.projects ?? [])
    .map((p, i) => ({
      name: p.project_title || "Sans titre",
      value:
        Number(p.assets_size ?? 0) +
        Number(p.versions_size ?? 0) +
        Number((p as { refs_size?: number }).refs_size ?? 0),
      projectId: p.project_id,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }))
    .filter((d) => d.value > 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Mon stockage
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            C’est toujours toi qui héberges les fichiers : même sur les projets où c’est le YouTuber qui t’a invité, tout le stockage (assets, versions, références) est compté sur ton quota. Le client ne stocke rien. Répartition par type et par projet ci-dessous.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="btn-interactive inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
      </div>

      {hasNoStorage && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200/90">
          Aucun stockage pour l’instant. Les chiffres ci-dessous concernent uniquement les projets où tu es le <strong>graphiste</strong> (designer). Si tu as créé un projet en tant que YouTuber (client), ajoute un graphiste via le lien d’invitation ou consulte un projet où tu es designer.
          <div className="mt-3">
            <button
              type="button"
              onClick={handleRecalculate}
              disabled={backfilling}
              className="rounded-lg border border-amber-500/50 bg-amber-500/20 px-3 py-2 text-sm font-medium text-amber-200 transition-colors hover:bg-amber-500/30 disabled:opacity-50"
            >
              {backfilling ? "Recalcul en cours…" : "Recalculer le stockage depuis les fichiers"}
            </button>
          </div>
        </div>
      )}

      <div className="glass-card rounded-xl border border-white/10 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Résumé</h2>
          </div>
          <button
            type="button"
            onClick={handleRecalculate}
            disabled={backfilling}
            className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
          >
            {backfilling ? "Recalcul…" : "Recalculer le stockage"}
          </button>
        </div>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums text-foreground">
              {formatBytes(used)}
            </span>
            <span className="text-muted-foreground">/ {formatBytes(limit)}</span>
          </div>
          <div className="h-3 w-full max-w-xs overflow-hidden rounded-full bg-muted sm:w-48">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="glass-card rounded-xl border border-white/10 p-6">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            <Image className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Par type de contenu
            </h2>
          </div>
          <div className="mt-4 h-[280px]">
            {typeData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Aucune donnée pour l’instant
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) =>
                      value > 0 ? `${name}: ${formatBytes(value)}` : ""
                    }
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} stroke="rgba(0,0,0,0.2)" strokeWidth={1} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatBytes(value)}
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#f1f5f9",
                    }}
                    labelStyle={{ color: "#f1f5f9" }}
                    itemStyle={{ color: "#e2e8f0" }}
                  />
                  <Legend
                    formatter={(value, entry: { payload?: { value?: number } }) => (
                      <span className="text-sm text-foreground">
                        {value} {entry?.payload?.value != null ? `(${formatBytes(entry.payload.value)})` : ""}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="glass-card rounded-xl border border-white/10 p-6">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            <FolderKanban className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Par projet
            </h2>
          </div>
          <div className="mt-4 h-[280px]">
            {projectData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Aucun projet avec du stockage
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) =>
                      value > 0 ? `${name}: ${formatBytes(value)}` : ""
                    }
                  >
                    {projectData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} stroke="rgba(0,0,0,0.2)" strokeWidth={1} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatBytes(value)}
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#f1f5f9",
                    }}
                    labelStyle={{ color: "#f1f5f9" }}
                    itemStyle={{ color: "#e2e8f0" }}
                  />
                  <Legend
                    formatter={(value, entry: { payload?: { value?: number } }) => (
                      <span className="text-sm text-foreground">
                        {value} {entry?.payload?.value != null ? `(${formatBytes(entry.payload.value)})` : ""}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {projectsSorted.length > 0 && (
        <div className="glass-card rounded-xl border border-white/10 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">
                Détail par projet
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <ArrowUpDown className="h-3.5 w-3.5" />
                Trier
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "size_desc" | "size_asc" | "name")}
                className="dropdown-pixel"
              >
                <option value="size_desc">Plus gros d’abord</option>
                <option value="size_asc">Plus légers d’abord</option>
                <option value="name">Par nom (A → Z)</option>
              </select>
            </div>
          </div>
          <ul className="mt-4 space-y-3">
            {projectsSorted.map((p) => {
              const refsSize = Number((p as { refs_size?: number }).refs_size ?? 0);
              const total =
                Number(p.assets_size ?? 0) + Number(p.versions_size ?? 0) + refsSize;
              if (total === 0) return null;
              return (
                <li key={p.project_id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                  <Link
                    href={`/projects/${p.project_id}`}
                    className="min-w-0 flex-1 font-medium text-foreground truncate hover:text-primary transition-colors"
                  >
                    {p.project_title || "Sans titre"}
                  </Link>
                  <span className="text-sm tabular-nums text-muted-foreground shrink-0">
                    {formatBytes(total)} (assets: {formatBytes(Number(p.assets_size ?? 0))}, versions: {formatBytes(Number(p.versions_size ?? 0))}
                    {refsSize > 0 ? `, refs: ${formatBytes(refsSize)}` : ""})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPurgeProjectId(p.project_id);
                      setPurgeProjectTitle(p.project_title || "Sans titre");
                    }}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400/90 hover:bg-red-500/10 transition-colors"
                    title="Libérer l’espace (supprime tous les fichiers du projet)"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Libérer l’espace
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {purgeProjectId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="purge-dialog-title"
        >
          <div className="glass-card w-full max-w-md rounded-2xl border border-white/10 p-6 shadow-xl">
            <h2 id="purge-dialog-title" className="text-lg font-semibold text-foreground">
              Libérer le stockage du projet
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Vous êtes sur le point de supprimer <strong className="text-foreground">tous les fichiers</strong> (assets, versions, références) du projet &quot;{purgeProjectTitle}&quot;. Le projet lui-même reste affiché ; seuls les fichiers sont retirés. Cette action est irréversible.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handlePurge(purgeProjectId)}
                disabled={purging}
                className="rounded-xl bg-red-500/20 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/30 disabled:opacity-50"
              >
                {purging ? "Suppression…" : "Confirmer la purge"}
              </button>
              <button
                type="button"
                onClick={() => { setPurgeProjectId(null); setPurgeProjectTitle(""); }}
                disabled={purging}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-white/5 disabled:opacity-50"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
