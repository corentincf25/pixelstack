import { ReactNode } from "react";

export default function AnonProjectLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#E5E7EB]">
      {children}
    </div>
  );
}
