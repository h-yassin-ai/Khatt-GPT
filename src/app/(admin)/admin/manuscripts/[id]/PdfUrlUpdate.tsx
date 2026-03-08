'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { FileText, Save, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function PdfUrlUpdate({ manuscriptId, currentUrl }: { manuscriptId: string, currentUrl?: string }) {
    const [url, setUrl] = useState(currentUrl || '')
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()
    const router = useRouter()

    const handleUpdate = async () => {
        setLoading(true)
        const supabase = createClient()

        const { error } = await supabase
            .from('manuscripts')
            .update({ pdf_url: url.trim() })
            .eq('id', manuscriptId)

        if (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        } else {
            toast({ title: "Updated!", description: "PDF URL has been updated." })
            router.refresh()
        }
        setLoading(false)
    }

    return (
        <div className="flex flex-col gap-2 p-4 rounded-xl bg-card border border-border shadow-sm">
            <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                <FileText className="w-3 h-3" /> Manuscript PDF URL
            </label>
            <div className="flex gap-2">
                <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 bg-muted/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <Button
                    size="sm"
                    onClick={handleUpdate}
                    disabled={loading || url === (currentUrl || '')}
                    className="shrink-0 gap-2"
                >
                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    Save
                </Button>
            </div>
            <p className="text-[10px] text-muted-foreground italic">Provide a direct link to the PDF file for contributors.</p>
        </div>
    )
}
