import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  Gauge,
  Megaphone,
  Settings,
  ShieldAlert,
  Ticket,
  Users,
  Wallet,
  PhoneCall,
  Activity,
  Search,
} from "lucide-react";
import { LogoutButton } from "@/components/crm/LogoutButton";
import { isAuthedServer } from "@/lib/session";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { href: "/crm", label: "Operations Bento", icon: Gauge, badge: "Live" },
  { href: "/crm/users", label: "Users & Segments", icon: Users },
  { href: "/crm/hosts", label: "Host Management", icon: BarChart3 },
  { href: "/crm/revenue", label: "Revenue & Finance", icon: Wallet, badge: "₹" },
  { href: "/crm/call-logs", label: "Call Logs & WebRTC", icon: PhoneCall },
];

const secondaryNavItems = [
  { href: "/crm/support", label: "Support Tickets", icon: Ticket },
  { href: "/crm/campaigns", label: "Push Campaigns", icon: Megaphone },
  { href: "/crm/fraud", label: "Fraud Sentry", icon: ShieldAlert, alert: true },
  { href: "/crm/funnel", label: "Conversion Funnel", icon: AlertTriangle },
  { href: "/crm/settings", label: "System Config", icon: Settings },
];

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAuthedServer())) {

    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-purple-500 selection:text-white">
      {/* Bento Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-surface/80 p-4 backdrop-blur-xl lg:flex lg:flex-col justify-between">
        <div>
          {/* Logo & Platform Tag */}
          <div className="mb-6 flex items-center justify-between">
            <Link href="/crm" className="flex items-center gap-2 select-none group">
              <svg viewBox="0 0 120 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-7 w-auto transition-transform group-hover:scale-105">
                <defs>
                  <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="50%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#38bdf8" />
                  </linearGradient>
                </defs>
                <text x="0" y="22" fill="url(#logoGrad)" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: 900, fontSize: 24, letterSpacing: '-0.05em' }}>friendoo</text>
              </svg>
              <span className="bento-badge text-[10px] text-purple-300 font-mono">
                BENTO
              </span>
            </Link>
          </div>

          {/* Quick Search Shortcut */}
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-xs text-muted-foreground">
            <Search className="h-3.5 w-3.5" />
            <span>Search users, hosts, calls...</span>
            <kbd className="ml-auto rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">⌘K</kbd>
          </div>

          {/* Primary Navigation */}
          <div className="space-y-4">
            <div>
              <div className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Core Operations
              </div>
              <nav className="space-y-1">
                {mainNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group flex items-center justify-between rounded-xl border border-transparent px-3 py-2 text-xs font-semibold text-muted-foreground transition-all duration-200 hover:border-purple-500/20 hover:bg-white/5 hover:text-foreground",
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-purple-400" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="rounded-full bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-bold text-purple-300">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div>
              <div className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Intelligence & Risk
              </div>
              <nav className="space-y-1">
                {secondaryNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group flex items-center justify-between rounded-xl border border-transparent px-3 py-2 text-xs font-semibold text-muted-foreground transition-all duration-200 hover:border-purple-500/20 hover:bg-white/5 hover:text-foreground",
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={cn(
                          "h-4 w-4 text-muted-foreground transition-colors",
                          item.alert ? "group-hover:text-red-400" : "group-hover:text-cyan-400"
                        )} />
                        <span>{item.label}</span>
                      </div>
                      {item.alert && (
                        <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* User Card & Logout */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-xs font-bold text-white shadow-sm">
                AD
              </div>
              <div>
                <div className="text-xs font-bold text-foreground">Super Administrator</div>
                <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
                  Online
                </div>
              </div>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 border-b border-border bg-background/80 px-5 py-3.5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span className="font-bold text-foreground">Friendoo Ops Center</span>
              <span>/</span>
              <span>Bento Intelligence Matrix</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                <Activity className="h-3.5 w-3.5 animate-pulse" />
                <span>WebRTC Mesh Online (0.0% Loss)</span>
              </div>
              <div className="lg:hidden">
                <LogoutButton />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

