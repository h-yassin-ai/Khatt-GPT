import { useState, useEffect } from "react"

// Simple custom toast hook since shadcn toast is complex to paste
type ToastProps = { title?: string; description?: string; variant?: "default" | "destructive" }

export function useToast() {
    const [toasts, setToasts] = useState<ToastProps[]>([])

    const toast = (props: ToastProps) => {
        setToasts((prev) => [...prev, props])
        // Auto dismissing logic or we just alert for this MVP if needed
        // In a real app we'd map toasts to a provider, but let's just use window alert for true MVP fallback 
        // or a simple fixed div at the bottom if we want to render it here
    }

    return { toast, toasts }
}
