import type { ReactNode } from "react";
import { X } from "lucide-react";

export function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-[#161B22] p-6 shadow-xl max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: "0 12px 30px rgba(0,0,0,0.12)" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
