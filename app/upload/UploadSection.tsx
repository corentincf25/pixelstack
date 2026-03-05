"use client";

import { useState } from "react";
import { UploadZone } from "@/components/UploadZone";

type Project = { id: string; title: string };

export function UploadSection({ projects }: { projects: Project[] }) {
  const [selectedId, setSelectedId] = useState<string>("");

  return (
    <div className="space-y-4">
      {projects.length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          Aucun projet. Crée un projet depuis le dashboard puis reviens ici pour déposer des fichiers.
        </p>
      ) : (
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Projet</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="dropdown-pixel w-full max-w-md"
            >
              <option value="">Choisir un projet…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
          {selectedId && (
            <div className="rounded-xl border border-border bg-card p-6">
              <UploadZone projectId={selectedId} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
