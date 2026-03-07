"use client";

import { useEffect, useState } from "react";
import { User } from "lucide-react";

type Props = { projectId: string };

export function AnonPresenceBanner({ projectId }: Props) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!projectId) return;
    const fetchPresence = () => {
      fetch(`/api/projects/${projectId}/anon-presence`, { credentials: "include" })
        .then((res) => res.json())
        .then((data) => {
          if (typeof data?.count === "number") setCount(data.count);
        })
        .catch(() => {});
    };
    fetchPresence();
    const interval = setInterval(fetchPresence, 10000);
    return () => clearInterval(interval);
  }, [projectId]);

  if (count === 0) return null;

  return (
    <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-200">
      <User className="h-4 w-4 shrink-0" />
      <span>
        {count === 1 ? "Un invité en train de consulter ce projet" : `${count} invités en train de consulter ce projet`}
      </span>
    </div>
  );
}
