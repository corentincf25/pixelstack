"use client";

import { useEffect, useRef, useState } from "react";

const defaultOptions: IntersectionObserverInit = {
  rootMargin: "0px 0px -80px 0px",
  threshold: 0.1,
};

/**
 * Retourne true quand l'élément est visible dans le viewport (pour animations au scroll).
 */
export function useInView(options: IntersectionObserverInit = defaultOptions) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) setInView(true);
    }, options);
    observer.observe(el);
    return () => observer.disconnect();
  }, [options.rootMargin, options.threshold]);

  return { ref, inView };
}
