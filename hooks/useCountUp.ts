"use client";

import { useEffect, useState } from "react";

/**
 * Anime un nombre de 0 à target sur duration ms (easing ease-out).
 */
export function useCountUp(target: number, duration = 500, enabled = true): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!enabled || target === 0) {
      setValue(target);
      return;
    }
    setValue(0);
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - t) * (1 - t);
      setValue(Math.round(eased * target));
      if (t < 1) requestAnimationFrame(step);
    };
    const id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [target, duration, enabled]);

  return value;
}
