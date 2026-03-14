'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { FileText, Save, Loader2, Upload, Link as LinkIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { uploadManuscriptPdf, updateManuscriptPdfUrl } from '../actions'

export default function PdfUrlUpdate({ manuscriptId, currentUrl }: { manuscriptId: string, currentUrl?: string }) {
    const [url, setUrl] = useState(currentUrl || '')
    const [loading, setLoading] = useState(false)
    const [mode, setMode] = useState<'url' | 'upload'>('url')
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { toast } = useToast()
    const router = useRouter()

    const handleUpdateUrl = async () => {
        setLoading(true)
        const res = await updateManuscriptPdfUrl(manuscriptId, url.trim())
        if (res.error) {
            toast({ title: "Error", description: res.error, variant: "destructive" })
        } else {
            toast({ title: "Updated!", description: "PDF URL has been updated." })
            router.refresh()
        }
        setLoading(false)
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.includes('pdf')) {
            toast({ title: "Invalid file", description: "Please upload a PDF file.", variant: "destructive" })
            return
        }

        setLoading(true)
        const formData = new FormData()
        formData.append('file', file)

        const res = await uploadManuscriptPdf(manuscriptId, formData)
        if (res.error) {
            toast({ title: "Upload failed", description: res.error, variant: "destructive" })
        } else {
            toast({ title: "Uploaded!", description: "PDF has been uploaded and linked." })
            setUrl(res.success ? '' : url) // success returns updated url usually but we refresh
            router.refresh()
        }
        setLoading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    return (
        <div className="flex flex-col gap-3 p-4 rounded-xl bg-card border border-border shadow-sm">
            <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                    <FileText className="w-3 h-3" /> Manuscript PDF
                </label>
                <div className="flex bg-muted rounded-lg p-0.5">
                    <button
                        onClick={() => setMode('url')}
                        className={`px-2 py-1 text-[10px] rounded-md transition-all ${mode === 'url' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
                    >
                        <LinkIcon className="w-2.5 h-2.5 inline mr-1" /> URL
                    </button>
                    <button
                        onClick={() => setMode('upload')}
                        className={`px-2 py-1 text-[10px] rounded-md transition-all ${mode === 'upload' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
                    >
                        <Upload className="w-2.5 h-2.5 inline mr-1" /> Upload
                    </button>
                </div>
            </div>

            {mode === 'url' ? (
                <div className="flex gap-2">
                    <input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 bg-muted/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <Button
                        size="sm"
                        onClick={handleUpdateUrl}
                        disabled={loading || url === (currentUrl || '')}
                        className="shrink-0 gap-2"
                    >
                        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        Save
                    </Button>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        ref={fileInputRef}
                        className="hidden"
                    />
                    <Button
                        variant="outline"
                        className="w-full border-dashed border-2 py-8 h-auto flex flex-col gap-2"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        ) : (
                            <Upload className="w-6 h-6 text-muted-foreground" />
                        )}
                        <span className="text-sm font-medium">Click to select PDF</span>
                        <span className="text-[10px] text-muted-foreground">PDF max. 10MB</span>
                    </Button>
                    {currentUrl && (
                        <p className="text-[10px] text-green-600 font-medium text-center">
                            ✓ Currently has a PDF linked
                        </p>
                    )}
                </div>
            )}
            <p className="text-[10px] text-muted-foreground italic">Provide the PDF manuscript for contributors to search within.</p>
        </div>
    )
}
