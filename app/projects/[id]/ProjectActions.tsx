"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ChevronDown } from "lucide-react";

const statusOptions = [
  { value: "draft", label: "Brouillon", className: "border-slate-500/50 bg-slate-500/15 text-slate-300" },
  { value: "in_progress", label: "En cours", className: "border-blue-500/50 bg-blue-500/15 text-blue-300" },
  { value: "review", label: "En revue", className: "border-amber-500/50 bg-amber-500/15 text-amber-200" },
  { value: "approved", label: "Approuvé", className: "border-emerald-500/50 bg-emerald-500/15 text-emerald-300" },
];

type ProjectActionsProps = {
  projectId: string;
  status: string;
  role: "designer" | "youtuber";
};

export function ProjectActions({ projectId, status, role }: ProjectActionsProps) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(false);

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    const { error } = await supabase
      .from("projects")
      .update({ status: newStatus })
      .eq("id", projectId);
    setUpdating(false);
    setOpenDropdown(false);
    if (!error) router.refresh();
  };

  const handleApprove = async () => {
    await updateStatus("approved");
  };

  const handleRequestChanges = async () => {
    await updateStatus("in_progress");
  };

  const currentOption = statusOptions.find((s) => s.value === status);
  const currentLabel = currentOption?.label ?? status;
  const currentClass = currentOption?.className ?? "border-border bg-background text-foreground";

  if (role === "designer") {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-5 py-4">
        <span className="text-sm text-muted-foreground">Statut</span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenDropdown((o) => !o)}
            disabled={updating}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium hover:opacity-90 ${currentClass}`}
          >
            {currentLabel}
            <ChevronDown className="h-4 w-4" />
          </button>
          {openDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                aria-hidden
                onClick={() => setOpenDropdown(false)}
              />
              <ul className="absolute left-0 top-full z-20 mt-1 min-w-[160px] rounded-lg border border-border bg-card py-1 shadow-lg">
                {statusOptions.map((opt) => (
                  <li key={opt.value}>
                    <button
                      type="button"
                      onClick={() => updateStatus(opt.value)}
                      className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                        status === opt.value
                          ? "bg-primary/10 font-medium"
                          : "text-foreground hover:bg-accent"
                      }`}
                    >
                      <span className={`h-2 w-2 shrink-0 rounded-full ${opt.value === "draft" ? "bg-slate-400" : opt.value === "in_progress" ? "bg-blue-400" : opt.value === "review" ? "bg-amber-400" : "bg-emerald-400"}`} />
                      {opt.label}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <span className="text-xs text-muted-foreground">· Dépose les versions dans la section Versions ci-dessous.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-5 py-4">
      <span className="text-sm text-muted-foreground">Statut</span>
      <span className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${currentClass}`}>
        {currentLabel}
      </span>
      {status === "review" && (
        <>
          <span className="text-sm text-muted-foreground">·</span>
          <button
            type="button"
            onClick={handleApprove}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Approuver
          </button>
          <button
            type="button"
            onClick={handleRequestChanges}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent"
          >
            Demander des modifications
          </button>
        </>
      )}
    </div>
  );
}
