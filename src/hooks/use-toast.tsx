"use client"

import { createContext, useCallback, useContext, useState } from "react"
import { useLanguage } from '@/lib/language-context'

type ToastProps = { title?: string; description?: string; variant?: "default" | "destructive" }
type ToastItem = ToastProps & { id: number }

type ToastContextValue = {
    toast: (props: ToastProps) => void
    toasts: ToastItem[]
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([])
    const { t } = useLanguage()

    const dismiss = useCallback((id: number) => {
        setToasts((prev) => prev.filter((item) => item.id !== id))
    }, [])

    const toast = useCallback((props: ToastProps) => {
        const id = Date.now() + Math.random()
        setToasts((prev) => [...prev.slice(-3), { ...props, id }])
        window.setTimeout(() => dismiss(id), 5000)
    }, [dismiss])

    return (
        <ToastContext.Provider value={{ toast, toasts }}>
            {children}
            <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[200] flex max-w-md flex-col gap-2 sm:left-auto sm:right-4 sm:w-[min(420px,calc(100vw-2rem))]" aria-live="polite" aria-atomic="true">
                {toasts.map((item) => (
                    <div
                        key={item.id}
                        className={`pointer-events-auto rounded-lg border p-4 shadow-lg backdrop-blur ${item.variant === 'destructive' ? 'border-destructive/30 bg-destructive/95 text-destructive-foreground' : 'border-border bg-card/95 text-card-foreground'}`}
                        role={item.variant === 'destructive' ? 'alert' : 'status'}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                {item.title && <p className="text-sm font-semibold">{item.title}</p>}
                                {item.description && <p className="mt-1 text-sm opacity-90">{item.description}</p>}
                            </div>
                            <button
                                type="button"
                                onClick={() => dismiss(item.id)}
                                className="shrink-0 rounded p-1 text-current/70 hover:bg-black/10 hover:text-current"
                                aria-label={t('common.close_notification')}
                            >
                                ×
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used inside ToastProvider')
    }
    return context
}
