"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { X, AlertCircle, CheckCircle2, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2, 8);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2 rounded-control border px-3 py-2 text-body shadow-lg animate-in ${
              t.type === "error"
                ? "border-status-error/30 bg-app-surface text-status-error"
                : t.type === "success"
                  ? "border-status-success/30 bg-app-surface text-status-success"
                  : "border-line bg-app-surface text-content-secondary"
            }`}
          >
            {t.type === "error" && <AlertCircle size={15} />}
            {t.type === "success" && <CheckCircle2 size={15} />}
            {t.type === "info" && <Info size={15} />}
            <span className="flex-1">{t.message}</span>
            <button
              className="ml-2 text-content-muted hover:text-content-primary"
              onClick={() => removeToast(t.id)}
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
