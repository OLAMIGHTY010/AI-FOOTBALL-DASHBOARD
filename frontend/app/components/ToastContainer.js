"use client";
import { useAppContext } from "@/app/context/AppContext";

export default function ToastContainer() {
  const { toasts, removeToast } = useAppContext();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 w-80 p-4 rounded-xl shadow-2xl transform transition-all duration-300 animate-slide-in-right backdrop-blur-md border ${
            toast.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30"
              : toast.type === "error"
              ? "bg-red-500/10 border-red-500/30"
              : toast.type === "warning"
              ? "bg-yellow-500/10 border-yellow-500/30"
              : "bg-[var(--bg-glass)] border-[var(--border-color)]"
          }`}
        >
          <div className="flex-shrink-0 text-2xl">
            {toast.type === "success" && "✅"}
            {toast.type === "error" && "❌"}
            {toast.type === "warning" && "⚠️"}
            {toast.type === "info" && "ℹ️"}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={`font-black text-sm truncate ${
              toast.type === "success" ? "text-emerald-500" :
              toast.type === "error" ? "text-red-500" :
              toast.type === "warning" ? "text-yellow-500" :
              "text-[var(--text-primary)]"
            }`}>
              {toast.title}
            </h4>
            <p className="text-xs text-[var(--text-secondary)] mt-1 break-words leading-relaxed">
              {toast.message}
            </p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-1"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
