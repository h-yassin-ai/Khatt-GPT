'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { bulkInsertSegmentsForPage, deleteSegment, reorderSegments, deletePage, updatePage } from '../actions'
import { Button } from '@/components/ui/button'
import { v4 as uuidv4 } from 'uuid'
import {
    UploadCloud, ChevronLeft, Trash2, CheckCircle2, Clock,
    GripVertical, Pencil, Check, X, AlertCircle, FileImage,
    Eye, MoreHorizontal, MessageSquare, Flag, AlertTriangle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"

const Badge = ({ children, className, variant = "outline" }: { children: React.ReactNode, className?: string, variant?: "default" | "outline" | "secondary" }) => (
    <span className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variant === "default" && "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        variant === "outline" && "text-foreground",
        variant === "secondary" && "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        className
    )}>
        {children}
    </span>
)

type Segment = {
    id: string
    image_url: string
    order_index: number
    status: string
    polygon?: any
    transcription_count: number
    segmentation_issue_reported?: boolean
    segmentation_issue_count?: number
    segmentation_issue_reported_at?: string
    transcriptions?: { id: string, text: string, submitted_at: string, contributor_id: string, is_validated: boolean, xp_awarded?: number | null }[]
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
    const [reviewSegment, setReviewSegment] = useState<Segment | null>(null)
    const [isReviewOpen, setIsReviewOpen] = useState(false)
    const [validatingId, setValidatingId] = useState<string | null>(null)
    const [pageImgSize, setPageImgSize] = useState({ width: 0, height: 0 })

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
            .select('*, transcriptions(id, text, submitted_at, contributor_id, is_validated, xp_awarded)')
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

    const getStatusColor = (seg: Segment) => {
        if (seg.segmentation_issue_reported) return 'purple'
        if (seg.status === 'validated') return 'green'
        if (seg.status === 'flagged' || seg.status === 'conflict') return 'red'
        if ((seg.transcriptions?.length || 0) > 1) return 'orange'
        return 'gray'
    }

    const handleOpenReview = (seg: Segment) => {
        setReviewSegment(seg)
        setIsReviewOpen(true)
    }

    const handleValidate = async (transcriptionId: string) => {
        setValidatingId(transcriptionId)
        try {
            // Import action from manuscript level actions which handles validation
            const { validateTranscription } = await import('../../actions')
            const res = await validateTranscription(transcriptionId, true)
            if (res.success) {
                toast({ title: "Transcription validée" })
                setIsReviewOpen(false)
                fetchData()
            } else {
                toast({ title: "Erreur", description: res.error, variant: "destructive" })
            }
        } catch (err: any) {
            toast({ title: "Erreur", description: err.message, variant: "destructive" })
        } finally {
            setValidatingId(null)
        }
    }

    const handlePageImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        setPageImgSize({
            width: e.currentTarget.naturalWidth,
            height: e.currentTarget.naturalHeight
        })
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
                    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm aspect-[3/4] relative group">
                        {page.image_url && page.image_url.trim() !== "" ? (
                            <>
                                <img
                                    src={page.image_url || undefined}
                                    alt="Full Page"
                                    className="w-full h-full object-contain"
                                    id="full-page-image"
                                    onLoad={handlePageImgLoad}
                                />
                                {/* SVG Overlay for segments */}
                                {pageImgSize.width > 0 && (
                                    <svg
                                        className="absolute inset-0 w-full h-full pointer-events-none"
                                        viewBox={`0 0 ${pageImgSize.width} ${pageImgSize.height}`}
                                        preserveAspectRatio="xMidYMid meet"
                                    >
                                        {segments.map((seg) => {
                                            if (!seg.polygon || !Array.isArray(seg.polygon) || seg.polygon.length === 0) return null
                                            const color = getStatusColor(seg)
                                            const strokeColor = color === 'green' ? '#22c55e' : color === 'red' ? '#ef4444' : color === 'orange' ? '#f59e0b' : '#94a3b8'
                                            const points = (seg.polygon as { x: number, y: number }[])
                                                .map(p => `${p.x},${p.y}`)
                                                .join(' ')
                                            return (
                                                <polygon
                                                    key={seg.id}
                                                    points={points}
                                                    fill={strokeColor}
                                                    fillOpacity="0.15"
                                                    stroke={strokeColor}
                                                    strokeWidth={pageImgSize.width / 500}
                                                    className="transition-all"
                                                />
                                            )
                                        })}
                                    </svg>
                                )}
                            </>
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
                                            {(() => {
                                                const color = getStatusColor(seg)
                                                return (
                                                     <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${color === 'green' ? 'bg-green-500/10 text-green-600 border border-green-500/20' :
                                                         color === 'red' ? 'bg-red-500/10 text-red-600 border border-red-500/20' :
                                                             color === 'orange' ? 'bg-orange-500/10 text-orange-600 border border-orange-500/20' :
                                                                 color === 'purple' ? 'bg-purple-500/10 text-purple-700 border border-purple-500/20' :
                                                                 'bg-muted/70 text-muted-foreground border border-border/50'
                                                         }`}>
                                                        {seg.segmentation_issue_reported ? 'SEGMENTATION' : seg.status === 'flagged' ? 'FLAGGED' : seg.status}
                                                        {color === 'orange' && seg.status !== 'conflict' && ' (MULTIPLE)'}
                                                    </span>
                                                )
                                            })()}
                                            {seg.segmentation_issue_reported && (
                                                <span className="text-[10px] text-purple-700 flex items-center gap-1 font-semibold">
                                                    <AlertTriangle className="w-2.5 h-2.5" />
                                                    {seg.segmentation_issue_count || 1} signalement
                                                </span>
                                            )}
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <Clock className="w-2.5 h-2.5" /> {seg.transcriptions?.length || 0} subs
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {(seg.transcriptions?.length || 0) > 0 && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 px-2 gap-1 text-xs"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleOpenReview(seg)
                                                }}
                                            >
                                                <Eye className="w-3.5 h-3.5" /> Review
                                            </Button>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleDeleteSegment(seg.id)
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-destructive hover:bg-destructive/10 rounded transition-all shrink-0"
                                            title="Delete this line"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Review Modal */}
            <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-2xl font-heading">
                            Review Segment #{reviewSegment?.order_index}
                        </DialogTitle>
                        <DialogDescription>
                            Compare subsmisison and validate the final transcription.
                        </DialogDescription>
                    </DialogHeader>

                    {reviewSegment && (
                        <div className="flex flex-col gap-6 py-4">
                            {/* Segment Image */}
                            <div className="bg-muted rounded-lg p-2 flex justify-center border border-border">
                                <img
                                    src={reviewSegment.image_url}
                                    alt="Segment"
                                    className="max-h-40 object-contain"
                                />
                            </div>

                            {/* Status Info */}
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status Actuel</span>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={reviewSegment.status === 'validated' ? 'secondary' : 'outline'} className={
                                            reviewSegment.status === 'validated' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                                                reviewSegment.status === 'conflict' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                                                    reviewSegment.status === 'flagged' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                                                        'bg-muted text-muted-foreground'
                                        }>
                                            <span className="capitalize">{reviewSegment.status}</span>
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">
                                            {reviewSegment.transcriptions?.length || 0} transcriptions reçues
                                        </span>
                                        {reviewSegment.segmentation_issue_reported && (
                                            <Badge className="bg-purple-500/10 text-purple-700 border-purple-500/20">
                                                <AlertTriangle className="w-3 h-3 mr-1" />
                                                Segmentation a revoir ({reviewSegment.segmentation_issue_count || 1})
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Transcriptions List */}
                            <div className="flex flex-col gap-3">
                                <h3 className="text-sm font-semibold flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-primary" /> Transcriptions suggérées
                                </h3>

                                {reviewSegment.transcriptions && reviewSegment.transcriptions.length > 0 ? (
                                    <div className="flex flex-col gap-3">
                                        {[...reviewSegment.transcriptions]
                                            .sort((a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime())
                                            .map((t, index) => (
                                            <div key={t.id} className={`p-4 rounded-xl border transition-all ${t.is_validated ? 'border-green-500 bg-green-50/30' : 'border-border bg-card shadow-sm'}`}>
                                                <div className="flex justify-between items-start gap-4 mb-3">
                                                    <div className="p-3 bg-muted/30 rounded-lg flex-1">
                                                        <p className="font-arabic text-2xl leading-relaxed text-right" dir="rtl">{t.text}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <Badge className={index === 0 ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border'}>
                                                            #{index + 1} {index === 0 ? 'premier submit' : 'submit suivant'}
                                                        </Badge>
                                                        {typeof t.xp_awarded === 'number' && (
                                                            <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/20">
                                                                +{t.xp_awarded} XP
                                                            </Badge>
                                                        )}
                                                        <div className="text-[10px] text-muted-foreground">
                                                            Posté le {new Date(t.submitted_at).toLocaleString()}
                                                        </div>
                                                        {t.is_validated && (
                                                            <Badge className="bg-green-500 hover:bg-green-600 text-white gap-1 py-0 px-2 h-5">
                                                                <Check className="w-3 h-3" /> Validé
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    {!t.is_validated && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleValidate(t.id)}
                                                            disabled={validatingId !== null}
                                                            className="gap-2"
                                                        >
                                                            {validatingId === t.id ? (
                                                                <Clock className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <CheckCircle2 className="w-4 h-4" />
                                                            )}
                                                            Valider cette version
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center bg-muted/30 rounded-xl border border-dashed border-border text-muted-foreground">
                                        Aucune transcription proposée pour le moment.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsReviewOpen(false)}>Fermer</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
