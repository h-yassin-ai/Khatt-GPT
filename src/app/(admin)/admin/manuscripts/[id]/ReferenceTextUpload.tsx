'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { checkManuscriptResourceColumn, updateManuscriptReferenceText } from '../actions'
import { useToast } from '@/hooks/use-toast'
import { FileText, Upload, Check, Loader2 } from 'lucide-react'
import { useLanguage } from '@/lib/language-context'

interface ReferenceTextUploadProps {
    manuscriptId: string
    currentUrl?: string
}

export default function ReferenceTextUpload({ manuscriptId, currentUrl }: ReferenceTextUploadProps) {
    const [uploading, setUploading] = useState(false)
    const { toast } = useToast()
    const { t, lang } = useLanguage()
    const supabase = useMemo(() => createClient(), [])

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
            toast({ title: t('admin.invalid_file'), description: t('admin.reference_file_hint'), variant: 'destructive' })
            return
        }

        setUploading(true)
        try {
            const schemaCheck = await checkManuscriptResourceColumn(manuscriptId, 'reference_text_url')
            if (schemaCheck.error) throw new Error(schemaCheck.error)

            const fileName = `reference.txt`
            const filePath = `${manuscriptId}/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('manuscripts')
                .upload(filePath, file, { upsert: true })

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage.from('manuscripts').getPublicUrl(filePath)

            const res = await updateManuscriptReferenceText(manuscriptId, publicUrl)
            if (res.error) throw new Error(res.error)

            toast({ title: t('admin.reference_updated') })
        } catch (err: any) {
            toast({ title: t('admin.upload_failed'), description: err.message, variant: 'destructive' })
        } finally {
            setUploading(false)
        }
    }

    const fileName = currentUrl ? currentUrl.split('/').pop() : null

    return (
        <div className="flex flex-col gap-3 p-4 bg-card border border-border rounded-xl shadow-sm" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-sm">{t('admin.reference_text')}</h3>
            </div>

            <p className="text-xs text-muted-foreground">
                {t('admin.reference_file_hint')}
            </p>

            {currentUrl ? (
                <div className="flex items-center justify-between gap-4 p-2 bg-muted/50 rounded-lg border border-border/50">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                        <span className="text-xs font-medium truncate">{fileName || t('admin.reference_uploaded')}</span>
                    </div>
                    <label className="shrink-0 cursor-pointer">
                        <input type="file" accept=".txt,.md" className="hidden" onChange={handleUpload} disabled={uploading} />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline">
                            {uploading ? '...' : t('admin.change')}
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
                        {uploading ? t('admin.uploading') : t('admin.upload_reference')}
                    </span>
                </label>
            )}
        </div>
    )
}
