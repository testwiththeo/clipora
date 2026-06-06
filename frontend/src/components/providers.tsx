"use client";

import { useEffect, useState } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { AppShell } from "@/components/layout/AppShell";

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem>
      <ErrorBoundary>
        <ToastProvider>
          <AppShell>{children}</AppShell>
        </ToastProvider>
      </ErrorBoundary>
    </NextThemesProvider>
  );
}
