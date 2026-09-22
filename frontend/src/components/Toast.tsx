import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info";

type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

let listeners: ((toasts: Toast[]) => void)[] = [];
let toastQueue: Toast[] = [];
let nextId = 0;

function notify() {
  for (const l of listeners) l([...toastQueue]);
}

export function showToast(message: string, type: ToastType = "info") {
  const toast: Toast = { id: nextId++, message, type };
  toastQueue.push(toast);
  notify();

  setTimeout(() => {
    toastQueue = toastQueue.filter((t) => t.id !== toast.id);
    notify();
  }, 4000);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    listeners.push(setToasts);
    return () => { listeners = listeners.filter((l) => l !== setToasts); };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-card shadow-lg text-[13px] font-semibold animate-slide-up ${
            t.type === "success" ? "bg-success-bg text-success-text border border-success-border" :
            t.type === "error" ? "bg-error-bg text-error-text border border-error-border" :
            "bg-surface text-ink border border-border"
          }`}
        >
          {t.type === "success" && (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          )}
          {t.type === "error" && (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          )}
          {t.message}
        </div>
      ))}
    </div>
  );
}
