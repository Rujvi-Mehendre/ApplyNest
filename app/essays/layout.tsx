import { DashboardShell } from "@/components/layout/DashboardLayout"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>
}

