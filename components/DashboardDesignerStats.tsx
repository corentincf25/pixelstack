"use client";

import type { ReactNode } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { FolderKanban, Users, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const statusLabels: Record<string, string> = {
  draft: "Brouillon",
  in_progress: "En cours",
  review: "En revue",
  approved: "Approuvé",
};

const statusColors = ["#6B7280", "#3B82F6", "#6366F1", "#10b981"];

type ProjectForStats = { id: string; status: string; client_id: string | null };

const statCardBase =
  "relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.05] p-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-[20px] transition-all duration-300 hover:border-white/[0.12] hover:shadow-[0_12px_48px_rgba(0,0,0,0.6)] sm:p-5";

/** Wrapper sans tilt 3D, uniquement le shine sur les bords au hover */
const cardShineWrap = "card-shine h-full min-h-[200px]";

type Props = { projects: ProjectForStats[]; storageSlot?: ReactNode };

export function DashboardDesignerStats({ projects, storageSlot }: Props) {
  const total = projects.length;
  const uniqueClients = new Set(projects.map((p) => p.client_id).filter(Boolean)).size;

  const byStatus = Object.entries(
    projects.reduce<Record<string, number>>((acc, p) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1;
      return acc;
    }, {})
  )
    .map(([status, count]) => ({ status, count, label: statusLabels[status] ?? status }))
    .sort((a, b) => ["draft", "in_progress", "review", "approved"].indexOf(a.status) - ["draft", "in_progress", "review", "approved"].indexOf(b.status));

  const delays = ["0ms", "80ms", "160ms", "240ms"];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:min-h-[200px]">
      <div className={cn("opacity-0 animate-card-in", cardShineWrap)} style={{ animationDelay: delays[0] }}>
        <div className={cn(statCardBase, "h-full border-l-4 border-l-[#6366F1] flex flex-col")}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[#9CA3AF]">Projets</p>
              <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-[#E5E7EB]">{total}</p>
            </div>
            <div className="rounded-xl bg-[#6366F1]/15 p-2.5">
              <FolderKanban className="h-5 w-5 text-[#6366F1]" />
            </div>
          </div>
        </div>
      </div>
      <div className={cn("opacity-0 animate-card-in", cardShineWrap)} style={{ animationDelay: delays[1] }}>
        <div className={cn(statCardBase, "h-full border-l-4 border-l-[#3B82F6] flex flex-col")}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[#9CA3AF]">Clients uniques</p>
              <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-[#E5E7EB]">{uniqueClients}</p>
            </div>
            <div className="rounded-xl bg-[#3B82F6]/15 p-2.5">
              <Users className="h-5 w-5 text-[#3B82F6]" />
            </div>
          </div>
        </div>
      </div>
      {storageSlot != null ? (
        <div className={cn("opacity-0 animate-card-in", "h-full min-h-[200px]")} style={{ animationDelay: delays[2] }}>
          {storageSlot}
        </div>
      ) : null}
      <div className={cn("opacity-0 animate-card-in", cardShineWrap, "sm:col-span-2 lg:col-span-2")} style={{ animationDelay: delays[3] }}>
        <div className={cn(statCardBase, "h-full border-l-4 border-l-amber-500/50 flex flex-col")}>
          <div className="mb-2 flex items-center gap-2">
            <div className="rounded-lg bg-amber-500/15 p-1.5">
              <BarChart3 className="h-4 w-4 text-amber-400" />
            </div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#9CA3AF]">Par statut</p>
          </div>
          <div className="h-24 flex-1 min-h-0">
            {byStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byStatus} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="currentColor" className="text-muted-foreground" />
                  <YAxis width={28} tick={{ fontSize: 10 }} stroke="currentColor" className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#181818", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", color: "#f1f1f1" }}
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  />
                  <Bar
                    dataKey="count"
                    radius={[4, 4, 0, 0]}
                    isAnimationActive
                    animationDuration={700}
                    animationBegin={300}
                  >
                    {byStatus.map((_, i) => (
                      <Cell key={i} fill={statusColors[i % statusColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="flex h-full items-center text-sm text-[#9CA3AF]">Aucun projet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
