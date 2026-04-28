"use client";

import { usePathname } from "next/navigation";

const pathTitles: Record<string, string> = {
  "/": "Dashboard",
  "/episodes": "Episodes",
  "/editor": "Clip Editor",
  "/settings": "Settings",
};

export function Topbar() {
  const pathname = usePathname();
  const title = pathTitles[pathname] || "Clipora";

  return (
    <header className="flex h-12 items-center justify-between border-b border-line bg-app-surface px-6">
      <h2 className="text-label font-medium text-content-secondary">{title}</h2>

      <div className="flex items-center gap-2">
        <span className="status-pill bg-status-success/10 text-status-success">
          <span className="h-1.5 w-1.5 rounded-full bg-status-success" />
          Connected
        </span>
      </div>
    </header>
  );
}
