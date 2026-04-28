"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Film,
  Scissors,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/episodes", label: "Episodes", icon: Film },
  { href: "/editor", label: "Editor", icon: Scissors },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 flex-col border-r border-line bg-app-surface">
      {/* Brand */}
      <div className="flex h-12 items-center gap-2 border-b border-line px-4">
        <div className="flex h-6 w-6 items-center justify-center rounded-control bg-accent text-[11px] font-bold text-accent-fg">
          C
        </div>
        <span className="text-label font-semibold text-content-primary">
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
              className={`flex items-center gap-2.5 rounded-control px-2.5 py-1.5 text-label transition-colors ${
                isActive
                  ? "bg-app-elevated text-content-primary font-medium"
                  : "text-content-secondary hover:bg-app-hover hover:text-content-primary"
              }`}
            >
              <Icon size={16} strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-line px-4 py-3">
        <span className="text-meta text-content-muted">v0.1.0</span>
      </div>
    </aside>
  );
}
