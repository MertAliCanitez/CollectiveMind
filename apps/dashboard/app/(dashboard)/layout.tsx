import { DashboardNav } from "../../components/layout/dashboard-nav"
import { DashboardHeader } from "../../components/layout/dashboard-header"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar — desktop only */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <DashboardNav />
      </div>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <DashboardHeader />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
