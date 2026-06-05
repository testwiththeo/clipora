"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Film,
  Scissors,
  Settings,
  Command,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/episodes", label: "Episodes", icon: Film },
  { href: "/editor", label: "Clips", icon: Scissors },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 flex-col border-r border-line bg-app-surface">
      {/* Brand */}
      <div className="flex h-12 items-center gap-2.5 border-b border-line px-4">
        <div className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-accent text-[11px] font-bold text-accent-fg">
          C
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-content-primary">
          Clipora
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-2 py-3">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-2.5 rounded-control px-2.5 py-[7px] text-label transition-all ${
                isActive
                  ? "bg-app-elevated text-content-primary font-medium"
                  : "text-content-secondary hover:bg-app-hover hover:text-content-primary"
              }`}
            >
              {/* Active indicator bar */}
              {isActive && (
                <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" />
              )}
              <Icon
                size={16}
                strokeWidth={isActive ? 2 : 1.75}
                className="flex-shrink-0"
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-line px-3 py-3">
        <div className="flex items-center gap-2 text-meta text-content-muted">
          <Command size={12} />
          <span>v0.1.0</span>
        </div>
      </div>
    </aside>
  );
}
