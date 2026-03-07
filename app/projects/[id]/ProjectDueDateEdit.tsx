"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Pencil, Check, X } from "lucide-react";

type ProjectDueDateEditProps = {
  projectId: string;
  initialDueDate: string | null;
  canEdit: boolean;
};

export function ProjectDueDateEdit({ projectId, initialDueDate, canEdit }: ProjectDueDateEditProps) {
  const router = useRouter();
  const [dueDate, setDueDate] = useState<string | null>(initialDueDate);
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState(
    initialDueDate ? initialDueDate.slice(0, 10) : ""
  );
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!inputValue.trim()) {
      setSaving(true);
      const { error } = await supabase
        .from("projects")
        .update({ due_date: null })
        .eq("id", projectId);
      setSaving(false);
      if (!error) {
        setDueDate(null);
        setInputValue("");
        setEditing(false);
        router.refresh();
      }
      return;
    }
    const iso = new Date(inputValue.trim()).toISOString();
    if (iso === "Invalid Date") return;
    setSaving(true);
    const { error } = await supabase
      .from("projects")
      .update({ due_date: iso })
      .eq("id", projectId);
    setSaving(false);
    if (!error) {
      setDueDate(iso);
      setEditing(false);
      router.refresh();
    }
  };

  const cancel = () => {
    setInputValue(dueDate ? dueDate.slice(0, 10) : "");
    setEditing(false);
  };

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
      <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="text-xs font-medium text-muted-foreground">Date de rendu</span>
      {editing && canEdit ? (
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <input
            type="date"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" />
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
          <button
            type="button"
            onClick={cancel}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
          >
            <X className="h-3.5 w-3.5" />
            Annuler
          </button>
        </div>
      ) : (
        <>
          <span className="text-sm text-foreground">
            {dueDate ? format(new Date(dueDate), "d MMMM yyyy", { locale: fr }) : "Non définie"}
          </span>
          {canEdit && (
            <button
              type="button"
              onClick={() => {
                setInputValue(dueDate ? dueDate.slice(0, 10) : "");
                setEditing(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" />
              Modifier
            </button>
          )}
        </>
      )}
    </div>
  );
}
