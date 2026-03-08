"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { ProjectActivityBanner } from "./ProjectActivityBanner";

type Counts = {
  messagesCount: number;
  versionsCount: number;
  assetsCount: number;
  referencesCount: number;
};

type ContextValue = {
  recordOwnAction: () => void;
};

const ProjectActivityContext = createContext<ContextValue | null>(null);

export function useProjectActivity() {
  return useContext(ProjectActivityContext);
}

type Props = {
  projectId: string;
  initialCounts: Counts;
  children: React.ReactNode;
};

const SUPPRESS_BANNER_MS = 18_000; // ~4–5 cycles de poll (4s) pour ne pas afficher après notre action

export function ProjectActivityProvider({ projectId, initialCounts, children }: Props) {
  const [lastOwnActionAt, setLastOwnActionAt] = useState(0);
  const recordOwnAction = useCallback(() => setLastOwnActionAt(Date.now()), []);

  return (
    <ProjectActivityContext.Provider value={{ recordOwnAction }}>
      {children}
      <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-6xl px-4 lg:left-auto lg:right-auto lg:px-0">
        <ProjectActivityBanner
          projectId={projectId}
          initialCounts={initialCounts}
          lastOwnActionAt={lastOwnActionAt}
          suppressIfOwnActionWithinMs={SUPPRESS_BANNER_MS}
        />
      </div>
    </ProjectActivityContext.Provider>
  );
}
