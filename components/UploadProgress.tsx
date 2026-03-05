"use client";

export function UploadProgress({ label = "Envoi en cours…" }: { label?: string }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="progress-indeterminate h-full w-1/3 rounded-full bg-primary" />
      </div>
    </div>
  );
}
