import React, { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const ICONS: Record<ToastType, React.ReactElement> = {
  success: <CheckCircle2 size={16} strokeWidth={2} />,
  error:   <XCircle      size={16} strokeWidth={2} />,
  warning: <AlertTriangle size={16} strokeWidth={2} />,
  info:    <Info          size={16} strokeWidth={2} />,
};

const STYLES: Record<ToastType, { bar: string; icon: string; bg: string; border: string }> = {
  success: {
    bg: "bg-white",
    border: "border-emerald-200",
    bar: "bg-emerald-500",
    icon: "bg-emerald-100 text-emerald-600",
  },
  error: {
    bg: "bg-white",
    border: "border-red-200",
    bar: "bg-red-500",
    icon: "bg-red-100 text-red-600",
  },
  warning: {
    bg: "bg-white",
    border: "border-amber-200",
    bar: "bg-amber-500",
    icon: "bg-amber-100 text-amber-600",
  },
  info: {
    bg: "bg-white",
    border: "border-blue-200",
    bar: "bg-blue-500",
    icon: "bg-blue-100 text-blue-600",
  },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const s = STYLES[toast.type];

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 10);
    const hide = setTimeout(() => {
      setLeaving(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, 3500);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, [toast.id, onRemove]);

  return (
    <div
      onClick={() => { setLeaving(true); setTimeout(() => onRemove(toast.id), 300); }}
      className={`
        relative flex items-center gap-3 w-80 rounded-xl border ${s.border} ${s.bg}
        shadow-[0_8px_30px_rgba(0,0,0,0.12)] cursor-pointer overflow-hidden
        transition-all duration-300
        ${visible && !leaving ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}
      `}
      style={{ padding: "12px 14px" }}
    >
      {/* Colour bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${s.bar} rounded-l-xl`} />

      {/* Icon */}
      <div className={`flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full ${s.icon}`}>
        {ICONS[toast.type]}
      </div>

      {/* Message */}
      <p className="flex-1 text-sm font-medium text-slate-800 leading-snug pl-1">{toast.message}</p>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100">
        <div
          className={`h-full ${s.bar} origin-left`}
          style={{ animation: "shrink 3.5s linear forwards" }}
        />
      </div>

      <style>{`@keyframes shrink { from { transform: scaleX(1); } to { transform: scaleX(0); } }`}</style>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = `toast-${++counter.current}`;
    setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={remove} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
