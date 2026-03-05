"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { X, Copy, Check } from "lucide-react";
import { DatePicker } from "@/components/DatePicker";
import { fireConfetti } from "@/lib/confetti";

type Role = "designer" | "youtuber";

type CreateProjectModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  role: Role | null;
  userId: string | null;
};

export function CreateProjectModal({
  open,
  onClose,
  onCreated,
  role,
  userId,
}: CreateProjectModalProps) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [concept, setConcept] = useState("");
  const [inspirations, setInspirations] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setTitle("");
    setDueDate(null);
    setConcept("");
    setInspirations("");
    setNotes("");
    setInviteLink(null);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !role || !userId) return;

    setSubmitting(true);
    setError(null);
    setInviteLink(null);

    try {
      const projectPayload =
        role === "youtuber"
          ? { title, status: "draft", client_id: userId, designer_id: null, due_date: dueDate ? dueDate.toISOString().split("T")[0] : null }
          : { title, status: "draft", client_id: null, designer_id: userId, due_date: dueDate ? dueDate.toISOString().split("T")[0] : null };

      const { data: project, error: insertError } = await supabase
        .from("projects")
        .insert(projectPayload)
        .select("id")
        .single();

      if (insertError) {
        setError(insertError.message);
        setSubmitting(false);
        return;
      }

      const { error: briefError } = await supabase.from("briefs").insert({
        project_id: project.id,
        concept: concept.trim() || null,
        hook: inspirations.trim() || null,
        notes: notes.trim() || null,
      });

      if (briefError) {
        setError(briefError.message);
        setSubmitting(false);
        return;
      }

      const inviteRole = role === "youtuber" ? "designer" : "client";
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { error: inviteError } = await supabase.from("project_invites").insert({
        project_id: project.id,
        token,
        role: inviteRole,
        expires_at: expiresAt.toISOString(),
      });

      if (inviteError) {
        setError(inviteError.message);
        setSubmitting(false);
        return;
      }

      setInviteLink(`${window.location.origin}/invite/${token}`);
      fireConfetti();
      onCreated?.();
    } catch {
      setError("Une erreur est survenue. Réessaie.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-black/60 p-4">
      <div className="my-8 w-full max-w-lg rounded-xl border border-border bg-card p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Nouveau projet
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {role === "youtuber"
                ? "Crée un projet et envoie le lien d'invitation à ton graphiste."
                : "Crée un projet et envoie le lien d'invitation à ton client (YouTuber)."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {inviteLink ? (
          <div className="space-y-4">
            <p className="text-sm text-foreground">
              Projet créé. Envoie ce lien à ton {role === "youtuber" ? "graphiste" : "client (YouTuber)"} :
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
              <button
                type="button"
                onClick={copyLink}
                className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copié" : "Copier"}
              </button>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              C'est fait
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Titre du projet *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ex. Miniature vidéo lancement"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Date de rendu (optionnel)</label>
              <DatePicker
                value={dueDate}
                onChange={setDueDate}
                placeholder="Choisir une date"
                minDate={new Date()}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Concept</label>
              <textarea
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="Idée principale, message à faire passer…"
                rows={2}
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Inspirations / Références</label>
              <textarea
                value={inspirations}
                onChange={(e) => setInspirations(e.target.value)}
                placeholder="Liens, exemples de visuels qui t'inspirent…"
                rows={2}
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Notes libres</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contraintes, délais, remarques…"
                rows={2}
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Tu pourras déposer les assets et modifier ce brief à tout moment dans le projet.
            </p>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting || !title.trim()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting ? "Création…" : "Créer le projet"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
