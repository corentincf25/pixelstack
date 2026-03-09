import { ReactNode } from "react";
import { GuestShell } from "@/components/GuestShell";

export default function AnonProjectLayout({ children }: { children: ReactNode }) {
  return <GuestShell>{children}</GuestShell>;
}
