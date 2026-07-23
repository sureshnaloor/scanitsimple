'use client';

import React from 'react';

type Toast = {
  id: number;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
};

type ToastContextValue = {
  toasts: Toast[];
  show: (toast: Omit<Toast, 'id'>) => void;
  dismiss: (id: number) => void;
};

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const idRef = React.useRef(1);

  const show: ToastContextValue['show'] = (toast) => {
    const id = idRef.current++;
    setToasts((prev) => [...prev, { id, ...toast }]);
    // Auto dismiss after 4s
    setTimeout(() => dismiss(id), 4000);
  };

  const dismiss: ToastContextValue['dismiss'] = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, show, dismiss }}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function Toaster() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="fixed top-4 right-4 flex flex-col gap-2 z-50">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={
            "min-w-[260px] max-w-[360px] rounded-md border px-4 py-3 shadow-lg bg-white text-slate-800 " +
            (t.variant === 'destructive'
              ? 'border-red-300 bg-red-50'
              : t.variant === 'success'
              ? 'border-green-300 bg-green-50'
              : 'border-slate-200')
          }
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              {t.title && <div className="font-medium mb-0.5">{t.title}</div>}
              {t.description && <div className="text-sm text-slate-700">{t.description}</div>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="text-slate-500 hover:text-slate-900"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}


