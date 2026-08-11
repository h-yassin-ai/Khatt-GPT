'use client'

import { useState } from 'react'
import { uploadManuscriptPdf } from '../actions'
import { useToast } from '@/hooks/use-toast'
import { FileDown, Upload, Check, Loader2 } from 'lucide-react'
import { useLanguage } from '@/lib/language-context'

interface PdfUploadProps {
    manuscriptId: string
    currentUrl?: string
}

export default function PdfUpload({ manuscriptId, currentUrl }: PdfUploadProps) {
    const [uploading, setUploading] = useState(false)
    const { toast } = useToast()
    const { t, lang } = useLanguage()

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.name.toLowerCase().endsWith('.pdf')) {
            toast({ title: t('admin.invalid_file'), description: '.pdf', variant: 'destructive' })
            return
        }

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const res = await uploadManuscriptPdf(manuscriptId, formData)
            if (res?.error) throw new Error(res.error)

            toast({ title: t('admin.pdf_updated') })
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
                <FileDown className="w-5 h-5 text-red-600" />
                <h3 className="font-semibold text-sm">{t('admin.pdf_title')}</h3>
            </div>

            <p className="text-xs text-muted-foreground">
                {t('admin.pdf_hint')}
            </p>

            {currentUrl ? (
                <div className="flex items-center justify-between gap-4 p-2 bg-muted/50 rounded-lg border border-border/50">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                        <span className="text-xs font-medium truncate">{fileName || t('admin.download_pdf')}</span>
                    </div>
                    <label className="shrink-0 cursor-pointer">
                        <input type="file" accept=".pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline">
                            {uploading ? '...' : t('admin.change')}
                        </span>
                    </label>
                </div>
            ) : (
                <label className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-colors rounded-lg cursor-pointer">
                    <input type="file" accept=".pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
                    {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                    ) : (
                        <Upload className="w-4 h-4 text-red-600" />
                    )}
                    <span className="text-xs font-semibold text-red-600">
                        {uploading ? t('admin.uploading') : t('admin.upload_pdf')}
                    </span>
                </label>
            )}
        </div>
    )
}
