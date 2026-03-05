import { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";

export default function ProjectsLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
