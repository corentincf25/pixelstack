"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Trash2, Archive } from "lucide-react";
import { ARCHIVE_PURGE_DAYS } from "@/lib/archive-constants";

type ProjectDeleteSectionProps = {
  projectId: string;
  currentUserId: string;
  deleteRequestedBy: string | null;
  isDesigner: boolean;
};

export function ProjectDeleteSection({
  projectId,
  currentUserId,
  deleteRequestedBy,
  isDesigner,
}: ProjectDeleteSectionProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const iRequestedDelete = deleteRequestedBy === currentUserId;

  const handleArchive = async () => {
    setArchiving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/archive`, { method: "POST" });
      if (res.ok) {
        setArchiveModalOpen(false);
        router.push("/dashboard");
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => ({}));
      alert(data?.error ?? "Erreur lors de l'archivage");
    } finally {
      setArchiving(false);
    }
  };

  const requestDelete = async () => {
    if (!confirm("Demander la suppression du projet ? L'autre partie devra confirmer.")) return;
    setLoading(true);
    const { error } = await supabase
      .from("projects")
      .update({ delete_requested_by: currentUserId, delete_requested_at: new Date().toISOString() })
      .eq("id", projectId);
    setLoading(false);
    if (!error) router.refresh();
  };

  const cancelRequest = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("projects")
      .update({ delete_requested_by: null, delete_requested_at: null })
      .eq("id", projectId);
    setLoading(false);
    if (!error) router.refresh();
  };

  const confirmDelete = async () => {
    if (!confirm("Confirmer la suppression définitive du projet ? Tous les fichiers (assets, versions, références, chat) seront supprimés. Cette action est irréversible.")) return;
    setLoading(true);
    const res = await fetch(`/api/projects/${projectId}/delete`, { method: "POST" });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      router.push("/dashboard");
      return;
    }
    alert(data?.error ?? "Erreur lors de la suppression");
  };

  if (iRequestedDelete) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
        <Trash2 className="h-4 w-4 text-amber-500" />
        <span className="text-muted-foreground">Tu as demandé la suppression. En attente de la confirmation de l'autre partie.</span>
        <button
          type="button"
          onClick={cancelRequest}
          disabled={loading}
          className="ml-auto rounded-lg border border-border px-3 py-1.5 text-foreground hover:bg-accent disabled:opacity-50"
        >
          Annuler la demande
        </button>
      </div>
    );
  }

  if (deleteRequestedBy) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
        <Trash2 className="h-4 w-4 text-destructive" />
        <span className="text-muted-foreground">L'autre partie a demandé la suppression du projet.</span>
        <button
          type="button"
          onClick={confirmDelete}
          disabled={loading}
          className="ml-auto rounded-lg bg-destructive px-3 py-1.5 text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
        >
          Confirmer la suppression
        </button>
        <button
          type="button"
          onClick={cancelRequest}
          disabled={loading}
          className="rounded-lg border border-border px-3 py-1.5 text-foreground hover:bg-accent disabled:opacity-50"
        >
          Refuser
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center gap-2">
          <Archive className="h-4 w-4" />
          <button
            type="button"
            onClick={() => setArchiveModalOpen(true)}
            disabled={loading}
            className="rounded-lg border border-border px-3 py-1.5 text-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
          >
            Archiver le projet
          </button>
        </div>
        <span className="text-white/40">·</span>
        <div className="flex flex-wrap items-center gap-2">
          <Trash2 className="h-4 w-4" />
          <span>Supprimer (nécessite l'accord des deux parties)</span>
          <button
            type="button"
            onClick={requestDelete}
            disabled={loading}
            className="rounded-lg border border-border px-3 py-1.5 text-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
          >
            Demander la suppression
          </button>
        </div>
      </div>

      {archiveModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="archive-dialog-title"
        >
          <div className="glass-card w-full max-w-md rounded-2xl border border-white/10 p-6 shadow-xl">
            <h2 id="archive-dialog-title" className="text-lg font-semibold text-foreground">
              Archiver ce projet ?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Le projet n'apparaîtra plus dans ton dashboard. Tu pourras le retrouver dans la liste des projets en cochant « Projets archivés ». <strong className="text-foreground">Les données du projet (fichiers, assets, versions, références) seront purgées automatiquement dans {ARCHIVE_PURGE_DAYS} jours.</strong>
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleArchive}
                disabled={archiving}
                className="rounded-xl border border-amber-500/40 bg-amber-500/20 px-4 py-2.5 text-sm font-medium text-amber-200 hover:bg-amber-500/30 disabled:opacity-50"
              >
                {archiving ? "Archivage…" : "Archiver"}
              </button>
              <button
                type="button"
                onClick={() => setArchiveModalOpen(false)}
                disabled={archiving}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-white/5 disabled:opacity-50"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
