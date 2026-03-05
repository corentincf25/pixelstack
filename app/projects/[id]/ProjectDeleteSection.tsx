"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Trash2 } from "lucide-react";

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
  const iRequestedDelete = deleteRequestedBy === currentUserId;

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
    if (!confirm("Confirmer la suppression définitive du projet ? Cette action est irréversible.")) return;
    setLoading(true);
    const { error } = await supabase.from("projects").delete().eq("id", projectId);
    setLoading(false);
    if (!error) router.push("/dashboard");
    else alert(error.message);
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
    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <Trash2 className="h-4 w-4" />
      <span>Supprimer le projet (nécessite l'accord des deux parties)</span>
      <button
        type="button"
        onClick={requestDelete}
        disabled={loading}
        className="rounded-lg border border-border px-3 py-1.5 text-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
      >
        Demander la suppression
      </button>
    </div>
  );
}
