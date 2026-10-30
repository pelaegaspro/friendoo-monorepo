"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface CrmNavItem {
  href: string;
  label: string;
  mobileLabel: string;
  count?: number;
}

const mainNavItems: CrmNavItem[] = [
  { href: "/crm", label: "Overview", mobileLabel: "Overview" },
  { href: "/crm/users", label: "Users", mobileLabel: "Users" },
  { href: "/crm/hosts", label: "Hosts", mobileLabel: "Hosts" },
  { href: "/crm/revenue", label: "Revenue", mobileLabel: "Revenue" },
  { href: "/crm/call-logs", label: "Call sessions", mobileLabel: "Calls" },
];

const secondaryNavItems: CrmNavItem[] = [
  { href: "/crm/support", label: "Support tickets", mobileLabel: "Support" },
  { href: "/crm/campaigns", label: "Campaigns", mobileLabel: "Campaigns" },
  { href: "/crm/fraud", label: "Activity review", mobileLabel: "Review" },
  { href: "/crm/funnel", label: "Funnel metrics", mobileLabel: "Funnel" },
  { href: "/crm/settings", label: "Settings", mobileLabel: "Settings" },
];

function isActivePath(pathname: string, href: string) {
  return href === "/crm" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item }: { item: CrmNavItem }) {
  const pathname = usePathname();
  const active = isActivePath(pathname, item.href);

  return (
    <Link
      href={item.href}
      className={cn(
        "flex h-8 items-center justify-between rounded-[8px] px-2 text-sm transition-colors",
        active
          ? "bg-[#1F5C4E]/10 font-semibold text-[#1F5C4E]"
          : "font-normal text-muted hover:bg-[#F4F4F5] hover:text-foreground"
      )}
    >
      <span>{item.label}</span>
      {typeof item.count === "number" && (
        <span className="text-xs text-muted">{item.count}</span>
      )}
    </Link>
  );
}

export function CrmDesktopNavigation() {
  return (
    <nav className="space-y-6">
      <div className="space-y-1">
        <div className="px-2 pb-1 text-xs font-medium uppercase tracking-wider text-muted">
          Platform
        </div>
        {mainNavItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </div>

      <div className="space-y-1">
        <div className="px-2 pb-1 text-xs font-medium uppercase tracking-wider text-muted">
          Management
        </div>
        {secondaryNavItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </div>
    </nav>
  );
}

export function CrmMobileNavigation() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 overflow-x-auto py-2">
      {[...mainNavItems, ...secondaryNavItems].map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "whitespace-nowrap rounded-[8px] px-3 py-1.5 text-xs transition-colors",
              active
                ? "bg-[#1F5C4E] font-medium text-white"
                : "text-muted hover:bg-[#F4F4F5] hover:text-foreground"
            )}
          >
            {item.mobileLabel}
          </Link>
        );
      })}
    </nav>
  );
}
