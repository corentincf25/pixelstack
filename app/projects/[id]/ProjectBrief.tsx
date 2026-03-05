"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FileText, Pencil, Check, X } from "lucide-react";

type Brief = {
  concept: string | null;
  hook: string | null;
  notes: string | null;
};

type ProjectBriefProps = {
  projectId: string;
  initialBrief: Brief | null;
  /** Dans une grille bento : pas de carte ni titre (géré par le parent). */
  embedded?: boolean;
};

export function ProjectBrief({ projectId, initialBrief, embedded }: ProjectBriefProps) {
  const [brief, setBrief] = useState<Brief | null>(initialBrief);
  const [editing, setEditing] = useState(false);
  const [concept, setConcept] = useState(initialBrief?.concept ?? "");
  const [inspirations, setInspirations] = useState(initialBrief?.hook ?? "");
  const [notes, setNotes] = useState(initialBrief?.notes ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setBrief(initialBrief);
    setConcept(initialBrief?.concept ?? "");
    setInspirations(initialBrief?.hook ?? "");
    setNotes(initialBrief?.notes ?? "");
  }, [initialBrief]);

  const startEdit = () => {
    setConcept(brief?.concept ?? "");
    setInspirations(brief?.hook ?? "");
    setNotes(brief?.notes ?? "");
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setConcept(brief?.concept ?? "");
    setInspirations(brief?.hook ?? "");
    setNotes(brief?.notes ?? "");
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("briefs")
      .upsert(
        {
          project_id: projectId,
          concept: concept.trim() || null,
          hook: inspirations.trim() || null,
          notes: notes.trim() || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "project_id" }
      );
    setSaving(false);
    if (!error) {
      setBrief({ concept: concept.trim() || null, hook: inspirations.trim() || null, notes: notes.trim() || null });
      setEditing(false);
    }
  };

  const isEmpty = !brief?.concept && !brief?.hook && !brief?.notes;

  const buttons = (
    <div className="flex justify-end gap-2">
      {!editing ? (
        <button
          type="button"
          onClick={startEdit}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Pencil className="h-3.5 w-3.5" />
          Modifier
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={cancelEdit}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
          >
            <X className="h-3.5 w-3.5" />
            Annuler
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" />
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </>
      )}
    </div>
  );

  const body = (
    <div className="mt-3">
      {editing ? (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Concept</label>
            <textarea
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              rows={2}
              className="mt-1 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Inspirations / Références</label>
            <textarea
              value={inspirations}
              onChange={(e) => setInspirations(e.target.value)}
              rows={2}
              className="mt-1 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Notes libres</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      ) : isEmpty ? (
        <p className="text-sm text-muted-foreground">
          Aucun brief renseigné. Clique sur « Modifier » pour ajouter le concept, les inspirations et les notes.
        </p>
      ) : (
        <div className="space-y-4 text-sm">
          {brief?.concept && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">Concept</span>
              <p className="mt-0.5 whitespace-pre-wrap text-foreground">{brief.concept}</p>
            </div>
          )}
          {brief?.hook && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">Inspirations / Références</span>
              <p className="mt-0.5 whitespace-pre-wrap text-foreground">{brief.hook}</p>
            </div>
          )}
          {brief?.notes && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">Notes</span>
              <p className="mt-0.5 whitespace-pre-wrap text-foreground">{brief.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (embedded) {
    return (
      <div>
        {buttons}
        {body}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Brief / Récap du projet
          </h2>
        </div>
        {buttons}
      </div>
      <div className="p-5">
        {body}
      </div>
    </div>
  );
}
