"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const pathLabels: Record<string, string> = {
  "/": "Home",
  "/episodes": "Episodes",
  "/editor": "Clips",
  "/settings": "Settings",
};

export function Topbar() {
  const pathname = usePathname();
  const label = pathLabels[pathname] ?? "Clipora";

  return (
    <header className="flex h-12 items-center justify-between border-b border-border px-6 glass">
      <motion.h2
        key={pathname}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="text-sm font-medium text-muted-foreground"
      >
        {label}
      </motion.h2>

      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Connected
        </span>
        <ThemeToggle />
      </div>
    </header>
  );
}
