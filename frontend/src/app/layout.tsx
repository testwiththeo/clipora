import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

export const metadata: Metadata = {
  title: "Clipora",
  description: "Podcast-to-clips editor",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <ErrorBoundary>
          <ToastProvider>
            <AppShell>{children}</AppShell>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
