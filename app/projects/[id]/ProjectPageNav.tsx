"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, FileText, Link2, Layers, MessageSquare, FileImage, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Ordre logique du pipeline : contexte → dépôts client → livrables → échanges
const SECTIONS = [
  { id: "brief", label: "Brief & Récap", icon: FileText, group: "Contexte" },
  { id: "partage", label: "Partage & Actions", icon: Link2, group: "Contexte" },
  { id: "assets", label: "Assets", icon: FileImage, group: "Contenu déposé" },
  { id: "references", label: "Inspirations & Références", icon: ImageIcon, group: "Contenu déposé" },
  { id: "versions", label: "Versions", icon: Layers, group: "Livrables" },
  { id: "chat", label: "Chat", icon: MessageSquare, group: "Échanges" },
] as const;

export function ProjectPageNav() {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setActiveId(e.target.id);
            break;
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed right-4 top-24 z-40 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-white/10 bg-card/90 text-foreground shadow-lg backdrop-blur-md lg:hidden"
        aria-expanded={open}
        aria-label="Navigation du projet"
      >
        {open ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
      </button>

      <aside
        className={cn(
          "glass-card border-white/10 transition-all duration-200",
          "w-52 shrink-0 border-l lg:fixed lg:right-0 lg:top-[3.5rem] lg:z-30 lg:h-[calc(100vh-3.5rem)] lg:overflow-y-auto lg:rounded-l-xl",
          "fixed right-0 top-0 z-30 h-full pt-20 pb-8 lg:pt-4",
          open
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0 pointer-events-none lg:translate-x-0 lg:opacity-100 lg:pointer-events-auto"
        )}
      >
        <div className="flex h-full flex-col px-3 py-4">
          <div className="mb-3 flex items-center justify-between px-2 lg:justify-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Dans ce projet
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded p-1 text-muted-foreground hover:bg-white/10 hover:text-foreground lg:hidden"
              aria-label="Fermer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <nav className="space-y-1 overflow-y-auto" aria-label="Navigation du projet">
            {(["Contexte", "Contenu déposé", "Livrables", "Échanges"] as const).map((group) => {
              const items = SECTIONS.filter((s) => s.group === group);
              if (items.length === 0) return null;
              return (
                <div key={group} className="space-y-0.5">
                  <p className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80">
                    {group}
                  </p>
                  {items.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => scrollTo(id)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                        activeId === id
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                      )}
                    >
                      <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md", activeId === id ? "bg-primary/20" : "bg-white/5")}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="truncate">{label}</span>
                    </button>
                  ))}
                </div>
              );
            })}
          </nav>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
          aria-hidden
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
