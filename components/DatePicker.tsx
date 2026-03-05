"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isBefore, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

type DatePickerProps = {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  minDate?: Date;
  className?: string;
};

export function DatePicker({ value, onChange, placeholder = "Choisir une date", minDate, className = "" }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ?? new Date());

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  // Lundi = premier jour (getDay: 0=dim, 1=lun, … → lun=0 pour le padding)
  const paddingDays = (monthStart.getDay() + 6) % 7;

  const min = minDate ? startOfDay(minDate) : null;

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-left text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        {value ? format(value, "d MMMM yyyy", { locale: fr }) : placeholder}
      </button>

      {open && (
        <>
          <div className="absolute left-0 top-full z-50 mt-1 rounded-xl border border-border bg-card p-3 shadow-lg" style={{ minWidth: "280px" }}>
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setViewDate((d) => subMonths(d, 1))}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium text-foreground">
                {format(viewDate, "MMMM yyyy", { locale: fr })}
              </span>
              <button
                type="button"
                onClick={() => setViewDate((d) => addMonths(d, 1))}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
              {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
                <div key={d} className="py-1 font-medium text-muted-foreground">
                  {d}
                </div>
              ))}
              {Array.from({ length: paddingDays }).map((_, i) => (
                <div key={`pad-${i}`} />
              ))}
              {days.map((day) => {
                const disabled = Boolean(min && isBefore(day, min));
                const selected = value && isSameDay(day, value);
                const currentMonth = isSameMonth(day, viewDate);
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      if (disabled) return;
                      onChange(day);
                      setOpen(false);
                    }}
                    className={`rounded-lg py-2 transition-colors ${
                      !currentMonth ? "text-muted-foreground/50" : "text-foreground"
                    } ${selected ? "bg-primary text-primary-foreground" : "hover:bg-muted"} ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
                  >
                    {format(day, "d")}
                  </button>
                );
              })}
            </div>
            {value && (
              <button
                type="button"
                onClick={() => { onChange(null); setOpen(false); }}
                className="mt-2 w-full rounded-lg border border-border py-1.5 text-xs text-muted-foreground hover:bg-muted"
              >
                Effacer la date
              </button>
            )}
          </div>
          <div
            className="fixed inset-0 z-40"
            aria-hidden
            onClick={() => setOpen(false)}
          />
        </>
      )}
    </div>
  );
}
