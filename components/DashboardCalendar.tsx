"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ProjectWithDue = { id: string; title: string; due_date: string | null };

export function DashboardCalendar({
  projects,
  currentUserId,
  isDesigner,
  compact = false,
}: {
  projects: ProjectWithDue[];
  currentUserId: string | null;
  isDesigner: boolean;
  compact?: boolean;
}) {
  const [month, setMonth] = useState(() => new Date());

  const projectsByDate = useMemo(() => {
    const byDate: Record<string, ProjectWithDue[]> = {};
    projects.forEach((p) => {
      if (!p.due_date) return;
      const d = p.due_date.slice(0, 10);
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push(p);
    });
    return byDate;
  }, [projects]);

  const days = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    return eachDayOfInterval({ start, end });
  }, [month]);

  const paddingDays = useMemo(() => (startOfMonth(month).getDay() - 1 + 7) % 7, [month]);

  if (!isDesigner) return null;

  return (
    <div className={cn("glass-card rounded-2xl border border-white/[0.08] overflow-hidden", compact && "max-w-xl", !compact && "w-full")}>
      <div className={cn("glass-card-header flex items-center justify-between", compact ? "px-3 py-2 sm:px-4" : "px-4 py-2.5 sm:px-5")}>
        <span className={cn("flex items-center gap-2 font-semibold text-foreground", compact ? "text-xs" : "text-sm")}>
          <CalendarIcon className={compact ? "h-3.5 w-3.5 text-primary" : "h-4 w-4 text-primary"} />
          Échéances
        </span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setMonth((m) => subMonths(m, 1))}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
            aria-label="Mois précédent"
          >
            <ChevronLeft className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          </button>
          <span className={cn("min-w-[100px] text-center font-medium text-foreground", compact ? "text-xs" : "text-sm")}>
            {format(month, "MMMM yyyy", { locale: fr })}
          </span>
          <button
            type="button"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
            aria-label="Mois suivant"
          >
            <ChevronRight className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          </button>
        </div>
      </div>
      <div className={compact ? "p-2 sm:p-3" : "p-3 sm:p-4"}>
        <div className={cn("grid grid-cols-7 gap-1 text-center font-medium text-muted-foreground", compact ? "text-[10px]" : "gap-1.5 text-xs")}>
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
            <div key={d} className={compact ? "py-0.5" : "py-1"}>{d}</div>
          ))}
        </div>
        <div className={cn("mt-1.5 grid grid-cols-7", compact ? "gap-0.5" : "mt-2 gap-1.5")}>
          {Array.from({ length: paddingDays }, (_, i) => (
            <div key={`pad-${i}`} className={cn("rounded bg-transparent", compact ? "min-h-[24px]" : "min-h-[32px] rounded-md")} />
          ))}
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayProjects = projectsByDate[key] ?? [];
            return (
              <div
                key={key}
                className={cn(
                  "rounded-md p-1 min-h-[32px]",
                  compact && "min-h-[24px] p-0.5",
                  isSameMonth(day, month) ? "bg-muted/20" : "opacity-50"
                )}
              >
                <span className={cn("block font-medium text-foreground", compact ? "text-[10px]" : "text-xs")}>
                  {format(day, "d")}
                </span>
                <div className={cn("mt-0.5 space-y-0.5", compact && "mt-0")}>
                  {dayProjects.slice(0, compact ? 1 : 2).map((p) => (
                    <Link
                      key={p.id}
                      href={`/projects/${p.id}`}
                      className={cn(
                        "block truncate rounded bg-primary/20 font-medium text-primary-foreground hover:bg-primary/40",
                        compact ? "px-1 py-0.5 text-[9px]" : "px-1 py-0.5 text-[10px]"
                      )}
                      title={p.title}
                    >
                      {p.title}
                    </Link>
                  ))}
                  {dayProjects.length > (compact ? 1 : 2) && (
                    <span className={cn("block text-muted-foreground", compact ? "text-[9px]" : "text-[10px]")}>
                      +{dayProjects.length - (compact ? 1 : 2)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
