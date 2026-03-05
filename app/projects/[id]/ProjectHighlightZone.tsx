"use client";

import { useEffect, useState } from "react";

/**
 * Entoure la zone (Chat ou Versions) d’une surbrillance quand on arrive sur la page
 * via une notif (nouveaux messages / nouvelles versions), puis retire après quelques secondes.
 */
export function ProjectHighlightZone({
  children,
  highlight,
}: {
  children: React.ReactNode;
  highlight: boolean;
}) {
  const [show, setShow] = useState(highlight);

  useEffect(() => {
    if (!highlight) return;
    const t = setTimeout(() => setShow(false), 5500);
    return () => clearTimeout(t);
  }, [highlight]);

  if (!show) return <>{children}</>;

  return (
    <div className="project-highlight-zone relative rounded-2xl ring-2 ring-primary ring-offset-2 ring-offset-background">
      {children}
    </div>
  );
}
