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
} from "lucide-react";
import { LogoutButton } from "@/components/crm/LogoutButton";
import { isAuthedServer } from "@/lib/session";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/crm", label: "Dashboard", icon: Gauge },
  { href: "/crm/users", label: "Users", icon: Users },
  { href: "/crm/hosts", label: "Hosts", icon: BarChart3 },
  { href: "/crm/revenue", label: "Revenue", icon: Wallet },
  { href: "/crm/support", label: "Support", icon: Ticket },
  { href: "/crm/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/crm/fraud", label: "Fraud", icon: ShieldAlert },
  { href: "/crm/funnel", label: "Funnel", icon: AlertTriangle },
  { href: "/crm/call-logs", label: "Call Logs", icon: PhoneCall },
  { href: "/crm/settings", label: "Settings", icon: Settings },
];

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  if (!isAuthedServer()) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-surface p-4 lg:flex lg:flex-col">
        <div className="mb-6 flex items-center gap-2 select-none">
          <svg viewBox="0 0 120 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-7 w-auto">
            <defs>
              <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7c5cff" />
                <stop offset="100%" stopColor="#ff7ab6" />
              </linearGradient>
            </defs>
            <text x="0" y="22" fill="url(#logoGrad)" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: 900, fontSize: 24, letterSpacing: '-0.05em' }}>friendoo</text>
          </svg>
          <span className="text-sm font-bold tracking-wider text-muted ml-1 bg-muted/10 px-1.5 py-0.5 rounded">
            CRM
          </span>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md border border-transparent px-3 py-2 text-sm text-muted transition-colors hover:border-border hover:bg-card hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-md border border-border bg-card p-3 text-xs">
          <div className="mb-2 text-muted">Logged in as</div>
          <div className="mb-3 font-medium">Admin</div>
          <LogoutButton />
        </div>
      </aside>
      <div className="flex-1">
        <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-muted">Friendoo Customer Intelligence Platform</div>
            <div className="lg:hidden">
              <LogoutButton />
            </div>
          </div>
        </header>
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
