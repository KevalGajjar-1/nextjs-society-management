import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { MobileNav } from '@/components/dashboard/mobile-nav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col md:flex-row h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 border-r border-border bg-card">
        <DashboardNav />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card">
          <MobileNav />
        </nav>
      </main>
    </div>
  )
}
