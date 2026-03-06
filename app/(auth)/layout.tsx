import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a0a0a] px-4 py-12">
      {/* Fond aligné avec la DA globale */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden
        style={{
          background: "linear-gradient(180deg, #0a0a0a 0%, #111111 50%, #181818 100%)",
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-40"
        aria-hidden
        style={{
          backgroundImage: `radial-gradient(1.5px 1.5px at 20% 30%, rgba(255,255,255,0.12) 0%, transparent 100%),
                           radial-gradient(1.5px 1.5px at 80% 70%, rgba(255,255,255,0.08) 0%, transparent 100%)`,
          backgroundSize: "200px 200px, 180px 180px",
        }}
      />
      {/* Lueur discrète accent */}
      <div
        className="pointer-events-none fixed right-0 top-1/4 z-0 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-[#6366F1]/10 blur-[100px]"
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-4xl">
        {children}
      </div>
    </div>
  );
}
