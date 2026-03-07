'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { createPage } from '../actions'
import { Button } from '@/components/ui/button'
import { v4 as uuidv4 } from 'uuid'
import { UploadCloud, ChevronLeft, FileImage } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { use } from 'react'

export default function NewPagePage({ params }: { params: Promise<{ id: string }> }) {
    const { id: manuscriptId } = use(params)
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [label, setLabel] = useState('')
    const [orderIndex, setOrderIndex] = useState(1)
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)

    const router = useRouter()
    const { toast } = useToast()
    const supabase = createClient()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]
        if (!f) return
        setFile(f)
        setPreview(URL.createObjectURL(f))
    }

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file) return

        setUploading(true)
        setUploadProgress(10)

        try {
            const ext = file.name.split('.').pop()
            const secureName = `${uuidv4()}.${ext}`
            const filePath = `${manuscriptId}/pages/${secureName}`

            const { error: uploadError } = await supabase.storage
                .from('manuscripts')
                .upload(filePath, file, { upsert: false })

            if (uploadError) {
                throw new Error(`Storage error: ${uploadError.message}`)
            }

            setUploadProgress(70)
            const { data } = supabase.storage.from('manuscripts').getPublicUrl(filePath)

            const result = await createPage({
                manuscriptId: manuscriptId,
                imageUrl: data.publicUrl,
                orderIndex: orderIndex,
                label: label || `Page ${orderIndex}`
            })

            setUploadProgress(100)

            if (result.error) throw new Error(result.error)

            toast({ title: "✅ Page added!", description: "Now you can upload lines for this page." })
            router.push(`/admin/manuscripts/${manuscriptId}/pages/${result.id}`)
            router.refresh()

        } catch (err: any) {
            toast({
                title: "Upload failed",
                description: err.message,
                variant: "destructive"
            })
            setUploading(false)
            setUploadProgress(0)
        }
    }

    return (
        <div className="max-w-2xl mx-auto py-10 flex flex-col gap-8">
            <div>
                <Link href={`/admin/manuscripts/${manuscriptId}`} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4">
                    <ChevronLeft className="w-4 h-4" /> Back to Manuscript
                </Link>
                <h1 className="text-3xl font-heading font-semibold mb-1">Add New Page</h1>
                <p className="text-muted-foreground">Upload the full-page scan. You'll add individual line images after.</p>
            </div>

            <form onSubmit={handleUpload} className="bg-card border border-border p-8 rounded-xl shadow-sm flex flex-col gap-6">

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Page Label</label>
                        <input
                            value={label}
                            onChange={e => setLabel(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                            placeholder="e.g. Page 3 or Folio 12r"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Order Position</label>
                        <input
                            type="number"
                            min={1}
                            value={orderIndex}
                            onChange={e => setOrderIndex(parseInt(e.target.value) || 1)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                        />
                    </div>
                </div>

                {/* File Drop Zone */}
                <div className="flex flex-col gap-3">
                    <label className="text-sm font-medium">Page Image <span className="text-destructive">*</span></label>
                    <div className="border-2 border-dashed border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors rounded-xl flex flex-col items-center justify-center gap-3 relative cursor-pointer overflow-hidden min-h-[200px]">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={uploading}
                        />
                        {preview ? (
                            <img src={preview} alt="Preview" className="w-full max-h-[300px] object-contain p-2 rounded-lg" />
                        ) : (
                            <>
                                <UploadCloud className="w-10 h-10 text-primary/60" />
                                <div className="text-center">
                                    <p className="font-medium text-sm">Click or drag a full-page scan here</p>
                                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP supported</p>
                                </div>
                            </>
                        )}
                    </div>
                    {file && (
                        <p className="text-xs text-muted-foreground text-center font-mono">
                            {file.name} — {(file.size / 1024).toFixed(1)} KB
                        </p>
                    )}
                </div>

                {uploading && (
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs font-semibold text-primary">
                            <span>Uploading...</span><span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                        </div>
                    </div>
                )}

                <Button type="submit" disabled={uploading || !file} className="w-full h-12 text-base">
                    {uploading ? 'Uploading...' : 'Upload Page & Add Lines →'}
                </Button>
            </form>
        </div>
    )
}
