"use client";

import { useCallback, useEffect, useRef } from "react";

const DEFAULT_MAX_LINES = 8;
const LINE_HEIGHT_APPROX = 22;

type Props = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "rows"> & {
  /** Nombre max de lignes visibles avant scroll (défaut 8). */
  maxRows?: number;
  /** Nombre de lignes initiales (défaut 1). */
  minRows?: number;
};

export function AutoResizeTextarea({
  maxRows = DEFAULT_MAX_LINES,
  minRows = 1,
  className = "",
  value,
  onChange,
  onKeyDown,
  ...rest
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const maxHeight = maxRows * LINE_HEIGHT_APPROX;
    const newHeight = Math.min(Math.max(el.scrollHeight, minRows * LINE_HEIGHT_APPROX), maxHeight);
    el.style.height = `${newHeight}px`;
  }, [maxRows, minRows]);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e);
    requestAnimationFrame(adjustHeight);
  };

  return (
    <textarea
      ref={ref}
      rows={minRows}
      value={value}
      onChange={handleChange}
      onKeyDown={onKeyDown}
      className={className}
      style={{ minHeight: minRows * LINE_HEIGHT_APPROX, maxHeight: maxRows * LINE_HEIGHT_APPROX, resize: "none" }}
      {...rest}
    />
  );
}
