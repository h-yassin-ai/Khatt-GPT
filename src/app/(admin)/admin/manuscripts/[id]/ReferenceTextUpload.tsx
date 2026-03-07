'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { updateManuscriptReferenceText } from '../actions'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { FileText, Upload, Check, Loader2, X } from 'lucide-react'

interface ReferenceTextUploadProps {
    manuscriptId: string
    currentUrl?: string
}

export default function ReferenceTextUpload({ manuscriptId, currentUrl }: ReferenceTextUploadProps) {
    const [uploading, setUploading] = useState(false)
    const { toast } = useToast()
    const supabase = createClient()

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
            toast({ title: 'Invalid file type', description: 'Please upload a .txt or .md file.', variant: 'destructive' })
            return
        }

        setUploading(true)
        try {
            const fileName = `reference.txt`
            const filePath = `${manuscriptId}/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('manuscripts')
                .upload(filePath, file, { upsert: true })

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage.from('manuscripts').getPublicUrl(filePath)

            const res = await updateManuscriptReferenceText(manuscriptId, publicUrl)
            if (res.error) throw new Error(res.error)

            toast({ title: 'Reference text updated!' })
        } catch (err: any) {
            toast({ title: 'Upload failed', description: err.message, variant: 'destructive' })
        } finally {
            setUploading(false)
        }
    }

    const fileName = currentUrl ? currentUrl.split('/').pop() : null

    return (
        <div className="flex flex-col gap-3 p-4 bg-card border border-border rounded-xl shadow-sm">
            <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-sm">Reference Text</h3>
            </div>

            <p className="text-xs text-muted-foreground">
                Upload the edited version of this book (.txt or .md) to help contributors with transcription.
            </p>

            {currentUrl ? (
                <div className="flex items-center justify-between gap-4 p-2 bg-muted/50 rounded-lg border border-border/50">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                        <span className="text-xs font-medium truncate">{fileName || 'Reference text uploaded'}</span>
                    </div>
                    <label className="shrink-0 cursor-pointer">
                        <input type="file" accept=".txt,.md" className="hidden" onChange={handleUpload} disabled={uploading} />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline">
                            {uploading ? '...' : 'Change'}
                        </span>
                    </label>
                </div>
            ) : (
                <label className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors rounded-lg cursor-pointer">
                    <input type="file" accept=".txt,.md" className="hidden" onChange={handleUpload} disabled={uploading} />
                    {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    ) : (
                        <Upload className="w-4 h-4 text-primary" />
                    )}
                    <span className="text-xs font-semibold text-primary">
                        {uploading ? 'Uploading...' : 'Upload Reference Text'}
                    </span>
                </label>
            )}
        </div>
    )
}
