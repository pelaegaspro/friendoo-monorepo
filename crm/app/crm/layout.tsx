import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/crm/LogoutButton";
import { CrmDesktopNavigation, CrmMobileNavigation } from "@/components/crm/CrmNavigation";
import { isAuthedServer, isSignInPaused } from "@/lib/session";

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  if (!isSignInPaused() && !(await isAuthedServer())) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Clean, grounded Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-surface p-6 lg:flex lg:flex-col justify-between">
        <div className="space-y-6">
          {/* Logo - Plain text label */}
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <Link href="/crm" className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-foreground">
                Friendoo
              </span>
              <span className="text-xs text-muted font-normal">
                CRM
              </span>
            </Link>
          </div>

          {/* Clean Navigation */}
          <CrmDesktopNavigation />
        </div>

        {/* User Card & Logout */}
        <div className="border-t border-border pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-foreground">Administrator</div>
              <div className="text-xs text-muted flex items-center gap-1.5 mt-0.5">
                <span className="status-dot-green" />
                <span>Active session</span>
              </div>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 border-b border-border bg-surface/90 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted">
              <span className="text-foreground font-medium">Dashboard</span>
              <span>/</span>
              <span>Overview</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-xs text-muted">
                <span className="status-dot-green" />
                <span>Signaling connected</span>
              </div>
              <div className="lg:hidden">
                <LogoutButton />
              </div>
            </div>
          </div>

          <div className="lg:hidden mt-2 pt-2 border-t border-border">
            <CrmMobileNavigation />
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
