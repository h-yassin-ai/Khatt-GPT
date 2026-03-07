'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { bulkInsertSegmentsForPage, deleteSegment, reorderSegments, deletePage, updatePage } from '../actions'
import { Button } from '@/components/ui/button'
import { v4 as uuidv4 } from 'uuid'
import {
    UploadCloud, ChevronLeft, Trash2, CheckCircle2, Clock,
    GripVertical, Pencil, Check, X, AlertCircle, FileImage
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

type Segment = {
    id: string
    image_url: string
    order_index: number
    status: string
    transcriptions?: { id: string }[]
}

export default function PageDetailPage({ params }: { params: Promise<{ id: string, pageId: string }> }) {
    const { id: manuscriptId, pageId } = use(params)
    const [page, setPage] = useState<any>(null)
    const [segments, setSegments] = useState<Segment[]>([])
    const [files, setFiles] = useState<File[]>([])
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [loading, setLoading] = useState(true)
    const [pageLabel, setPageLabel] = useState('')
    const [editingLabel, setEditingLabel] = useState(false)
    const [showUploader, setShowUploader] = useState(false)
    const [dragging, setDragging] = useState<number | null>(null)

    const router = useRouter()
    const { toast } = useToast()
    const supabase = createClient()

    const fetchData = useCallback(async () => {
        const { data: pageData } = await supabase
            .from('pages')
            .select('*')
            .eq('id', pageId)
            .single()

        if (pageData) {
            setPage(pageData)
            setPageLabel(pageData.label || `Page ${pageData.order_index}`)
        }

        const { data: segs } = await supabase
            .from('segments')
            .select('*, transcriptions(id)')
            .eq('page_id', pageId)
            .order('order_index', { ascending: true })

        setSegments(segs || [])
        setLoading(false)
    }, [pageId, supabase])

    useEffect(() => { fetchData() }, [fetchData])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files).sort((a, b) => a.name.localeCompare(b.name))
            setFiles(selectedFiles)
        }
    }

    const handleUploadLines = async (e: React.FormEvent) => {
        e.preventDefault()
        if (files.length === 0) return

        setUploading(true)
        setUploadProgress(0)

        try {
            const segmentDetails: { image_url: string, order_index: number }[] = []
            const startingIndex = segments.length + 1

            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                const ext = file.name.split('.').pop()
                const secureName = `${uuidv4()}.${ext}`
                const filePath = `${manuscriptId}/pages/${pageId}/segments/${secureName}`

                const { error: uploadError } = await supabase.storage
                    .from('manuscripts')
                    .upload(filePath, file, { upsert: false })

                if (uploadError) {
                    console.error('Upload error for', file.name, uploadError)
                    toast({
                        title: `Failed: ${file.name}`,
                        description: uploadError.message,
                        variant: "destructive"
                    })
                } else {
                    const { data } = supabase.storage.from('manuscripts').getPublicUrl(filePath)
                    segmentDetails.push({
                        image_url: data.publicUrl,
                        order_index: startingIndex + i
                    })
                }

                setUploadProgress(Math.round(((i + 1) / files.length) * 100))
            }

            if (segmentDetails.length > 0) {
                const result = await bulkInsertSegmentsForPage(pageId, manuscriptId, segmentDetails)
                if (result.error) throw new Error(result.error)
            }

            toast({ title: `✅ ${segmentDetails.length} lines added!` })
            setFiles([])
            setShowUploader(false)
            await fetchData()

        } catch (err: any) {
            toast({ title: "Upload failed", description: err.message, variant: "destructive" })
        } finally {
            setUploading(false)
            setUploadProgress(0)
        }
    }

    const handleDeleteSegment = async (segmentId: string) => {
        if (!confirm('Delete this line segment? This is irreversible.')) return
        const res = await deleteSegment(segmentId, manuscriptId, pageId)
        if (res.success) {
            setSegments(prev => prev.filter(s => s.id !== segmentId))
            toast({ title: 'Line deleted' })
        } else {
            toast({ title: 'Error', description: res.error, variant: 'destructive' })
        }
    }

    const handleDeletePage = async () => {
        if (!confirm('Delete this page AND all its lines? This cannot be undone.')) return
        const res = await deletePage(pageId, manuscriptId)
        if (res.success) {
            router.push(`/admin/manuscripts/${manuscriptId}`)
        } else {
            toast({ title: 'Error', description: res.error, variant: 'destructive' })
        }
    }

    const handleSaveLabel = async () => {
        const res = await updatePage(pageId, manuscriptId, { label: pageLabel })
        if (res.success) {
            toast({ title: 'Page renamed' })
            setEditingLabel(false)
        }
    }

    // Drag to reorder segments
    const handleDragStart = (idx: number) => setDragging(idx)
    const handleDragOver = (e: React.DragEvent, idx: number) => {
        e.preventDefault()
        if (dragging === null || dragging === idx) return
        const reordered = [...segments]
        const [moved] = reordered.splice(dragging, 1)
        reordered.splice(idx, 0, moved)
        const withNewIndex = reordered.map((s, i) => ({ ...s, order_index: i + 1 }))
        setSegments(withNewIndex)
        setDragging(idx)
    }
    const handleDragEnd = async () => {
        setDragging(null)
        // Persist reorder
        await reorderSegments(
            segments.map(s => ({ id: s.id, order_index: s.order_index })),
            manuscriptId, pageId
        )
        toast({ title: 'Order saved' })
    }

    if (loading) return <div className="p-20 text-center text-muted-foreground">Loading page...</div>
    if (!page) return <div className="p-20 text-center text-muted-foreground">Page not found.</div>

    return (
        <div className="flex flex-col gap-8 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-3">
                <Link href={`/admin/manuscripts/${manuscriptId}`} className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <ChevronLeft className="w-4 h-4" /> Back to Manuscript
                </Link>
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        {editingLabel ? (
                            <div className="flex items-center gap-2">
                                <input
                                    value={pageLabel}
                                    onChange={e => setPageLabel(e.target.value)}
                                    className="h-10 px-3 rounded-md border border-primary text-lg font-semibold focus:outline-none"
                                    autoFocus
                                    onKeyDown={e => { if (e.key === 'Enter') handleSaveLabel(); if (e.key === 'Escape') setEditingLabel(false) }}
                                />
                                <Button size="sm" onClick={handleSaveLabel} className="h-9"><Check className="w-4 h-4" /></Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingLabel(false)} className="h-9"><X className="w-4 h-4" /></Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <h1 className="text-3xl font-heading font-semibold">{pageLabel || `Page ${page.order_index}`}</h1>
                                <button onClick={() => setEditingLabel(true)} className="p-1.5 rounded hover:bg-muted transition-colors" title="Rename page">
                                    <Pencil className="w-4 h-4 text-muted-foreground" />
                                </button>
                            </div>
                        )}
                        <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full font-mono">Position #{page.order_index}</span>
                    </div>
                    <Button variant="destructive" size="sm" onClick={handleDeletePage} className="gap-2 shrink-0">
                        <Trash2 className="w-4 h-4" /> Delete Page
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Full Page Scan */}
                <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-semibold">Full Page Scan</h2>
                    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm aspect-[3/4]">
                        {page.image_url && page.image_url.trim() !== "" ? (
                            <img src={page.image_url || undefined} alt="Full Page" className="w-full h-full object-contain" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                                <FileImage className="w-12 h-12 text-muted-foreground opacity-20" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Lines Panel */}
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Lines ({segments.length})</h2>
                        <Button size="sm" onClick={() => setShowUploader(!showUploader)} className="gap-2">
                            <UploadCloud className="w-4 h-4" />
                            {showUploader ? 'Cancel' : 'Add Lines'}
                        </Button>
                    </div>

                    {/* Uploader */}
                    {showUploader && (
                        <form onSubmit={handleUploadLines} className="bg-card border border-border p-5 rounded-xl flex flex-col gap-4 shadow-sm">
                            <p className="text-sm text-muted-foreground">Select multiple line images. They will be added after existing lines, sorted by filename.</p>
                            <div className="border-2 border-dashed border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors rounded-xl p-6 flex flex-col items-center justify-center text-center relative cursor-pointer">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    disabled={uploading}
                                />
                                <UploadCloud className="w-8 h-8 text-primary/60 mb-2" />
                                <p className="text-sm font-medium">{files.length > 0 ? `${files.length} files ready` : 'Click or drag line images here'}</p>
                                {files.length > 0 && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {files.map(f => f.name).slice(0, 3).join(', ')}{files.length > 3 ? `... +${files.length - 3} more` : ''}
                                    </p>
                                )}
                            </div>
                            {uploading && (
                                <div className="flex flex-col gap-1">
                                    <div className="flex justify-between text-xs font-semibold text-primary">
                                        <span>Uploading...</span><span>{uploadProgress}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-primary transition-all" style={{ width: `${uploadProgress}%` }} />
                                    </div>
                                </div>
                            )}
                            <Button type="submit" disabled={uploading || files.length === 0} className="w-full">
                                {uploading ? 'Uploading...' : `Upload ${files.length} Lines`}
                            </Button>
                        </form>
                    )}

                    {/* Drag-to-reorder segment list */}
                    {segments.length === 0 && !showUploader ? (
                        <div className="p-12 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                            <p className="font-medium">No lines yet.</p>
                            <p className="text-sm">Click "Add Lines" to upload segment images for this page.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <GripVertical className="w-3 h-3" /> Drag to reorder — changes save automatically
                            </p>
                            {segments.map((seg, idx) => (
                                <div
                                    key={seg.id}
                                    draggable
                                    onDragStart={() => handleDragStart(idx)}
                                    onDragOver={(e) => handleDragOver(e, idx)}
                                    onDragEnd={handleDragEnd}
                                    className={`bg-card border rounded-lg p-3 flex items-center gap-3 group cursor-grab active:cursor-grabbing transition-all ${dragging === idx ? 'opacity-50 scale-95 border-primary' : 'border-border hover:border-primary/30'}`}
                                >
                                    <GripVertical className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0" />
                                    <div className="w-12 h-10 bg-muted rounded overflow-hidden flex-shrink-0 border border-border/50">
                                        {seg.image_url && seg.image_url.trim() !== "" ? (
                                            <img src={seg.image_url || undefined} className="w-full h-full object-cover" alt={`Line ${idx + 1}`} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <FileImage className="w-4 h-4 text-muted-foreground opacity-20" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 flex flex-col min-w-0">
                                        <span className="text-sm font-medium text-foreground">Line #{seg.order_index}</span>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${seg.status === 'validated' ? 'bg-green-500/10 text-green-600' :
                                                seg.status === 'conflict' ? 'bg-red-500/10 text-red-600' :
                                                    'bg-muted/70 text-muted-foreground'
                                                }`}>
                                                {seg.status}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <Clock className="w-2.5 h-2.5" /> {seg.transcriptions?.length || 0} subs
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteSegment(seg.id)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-destructive hover:bg-destructive/10 rounded transition-all shrink-0"
                                        title="Delete this line"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
