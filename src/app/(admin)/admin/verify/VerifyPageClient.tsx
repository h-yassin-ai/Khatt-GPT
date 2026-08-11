'use client'

import { useState, useRef } from 'react'
import { approveTranscription, rejectTranscription, getValidatedSegments, bulkRejectTranscriptions } from './actions'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/lib/language-context'
import {
    Check, Edit2, Save, Trash2, AlertCircle, ImageIcon,
    ClipboardCheck, History, ChevronDown, Loader2
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

type Transcription = {
    id: string
    text: string
    submitted_at: string
    is_validated: boolean
    contributor_id: string
    image_url?: string | null
    page_image_url?: string | null
    polygon?: any
    xp_awarded?: number | null
    status?: string | null
    profiles?: { display_name?: string; username?: string } | null
}

type Segment = {
    id: string
    image_url?: string | null
    polygon?: any
    status: string
    order_index: number
    transcription_count?: number
    consensus_text?: string | null
    consensus_reached_at?: string | null
    manuscripts?: { title?: string } | null
    pages?: { image_url?: string | null } | null
    transcriptions: Transcription[]
}

/** Renders the page image with the polygon highlighted, exactly like the transcription UI */
const SegmentImageWithPolygon = ({
    pageImageUrl,
    polygon,
    fallbackImageUrl,
    showContext = true, // Default to true if not specified, but we'll control it
}: {
    pageImageUrl?: string | null
    polygon?: any
    fallbackImageUrl?: string | null
    showContext?: boolean
}) => {
    const { t } = useLanguage()
    const [imgSize, setImgSize] = useState({ width: 0, height: 0 })
    const containerRef = useRef<HTMLDivElement>(null)

    const hasPolygon = polygon && Array.isArray(polygon) && polygon.length > 0

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget
        const container = containerRef.current
        if (!container) return
        const containerW = container.clientWidth
        const naturalW = img.naturalWidth
        const naturalH = img.naturalHeight
        const renderScale = containerW / naturalW
        setImgSize({ width: naturalW * renderScale, height: naturalH * renderScale })
    }

    // If context is OFF and we have a crop, show the crop
    if (!showContext && fallbackImageUrl) {
        return (
            <img
                src={fallbackImageUrl}
                alt={t('admin.segment_alt')}
                className="w-full max-h-[320px] object-contain rounded-sm shadow-md bg-white/5"
            />
        )
    }

    // Normal full page view with polygon
    if (pageImageUrl) {
        return (
            <div ref={containerRef} className="relative w-full overflow-hidden rounded-sm shadow-md bg-black/5">
                <img
                    src={pageImageUrl}
                    alt={t('admin.full_page_scan')}
                    className="w-full max-h-[400px] object-contain"
                    onLoad={handleImageLoad}
                />
                {hasPolygon && imgSize.width > 0 && (
                    <svg
                        className="absolute inset-0 pointer-events-none"
                        width={imgSize.width}
                        height={imgSize.height}
                        viewBox={`0 0 ${imgSize.width} ${imgSize.height}`}
                    >
                        <defs>
                            <mask id={`mask-${polygon[0]?.x}`}>
                                <rect width={imgSize.width} height={imgSize.height} fill="black" />
                                <polygon
                                    points={polygon.map((p: any) => `${p.x},${p.y}`).join(' ')}
                                    fill="white"
                                />
                            </mask>
                        </defs>
                        <rect
                            width={imgSize.width}
                            height={imgSize.height}
                            fill="rgba(0,0,0,0.6)"
                            mask={`url(#mask-${polygon[0]?.x})`}
                        />
                        <polygon
                            points={polygon.map((p: any) => `${p.x},${p.y}`).join(' ')}
                            fill="none"
                            stroke="rgba(255,200,0,1)"
                            strokeWidth="2.5"
                        />
                    </svg>
                )}
            </div>
        )
    }

    if (fallbackImageUrl) {
        return (
            <img
                src={fallbackImageUrl}
                alt={t('admin.segment_alt')}
                className="w-full max-h-[320px] object-contain rounded-sm shadow"
            />
        )
    }

    return (
        <div className="flex flex-col items-center gap-2 text-muted-foreground opacity-30 py-8">
            <ImageIcon className="w-10 h-10" />
            <span className="text-xs">{t('admin.no_image')}</span>
        </div>
    )
}



function TranscriptionCard({
    t,
    seg,
    loading,
    editingId,
    editText,
    onApprove,
    onReject,
    onStartEdit,
    onCancelEdit,
    onSaveEdit,
    onEditTextChange,
}: {
    t: Transcription
    seg: Segment
    loading: string | null
    editingId: string | null
    editText: string
    onApprove: () => void
    onReject: () => void
    onStartEdit: () => void
    onCancelEdit: () => void
    onSaveEdit: () => void
    onEditTextChange: (v: string) => void
}) {
    const [showContext, setShowContext] = useState(false)
    const { t: tx, lang } = useLanguage()

    // Priority: use the page_image_url + polygon stored at submission time (exact same view as contributor)
    // Fall back to: current segment page, then segment crop
    const pageImage = t.page_image_url || seg.pages?.image_url || null
    const polygon = t.polygon || seg.polygon || null
    const fallback = t.image_url || seg.image_url || null

    // If the image shown to contributor differs from current segment image, warn admin
    const imageChanged = (t.page_image_url && seg.pages?.image_url && t.page_image_url !== seg.pages?.image_url)

    return (
        <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm flex flex-col lg:flex-row group hover:border-primary/30 transition-colors">
            {/* Image column */}
            <div className="lg:w-1/2 bg-black/5 flex flex-col items-center justify-start p-3 border-b lg:border-b-0 lg:border-r border-border relative gap-2">
                <SegmentImageWithPolygon
                    pageImageUrl={pageImage}
                    polygon={polygon}
                    fallbackImageUrl={fallback}
                    showContext={showContext}
                />
                
                <div className="flex w-full items-center justify-between px-1">
                    <div className="bg-background/80 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold border border-border shadow-sm">
                        {seg.manuscripts?.title} – #{seg.order_index}
                    </div>
                    {pageImage && fallback && (
                        <button
                            onClick={() => setShowContext(!showContext)}
                            className="flex items-center gap-1.5 text-[10px] font-medium text-primary hover:underline"
                        >
                            <ImageIcon className="w-3 h-3" />
                            {showContext ? tx('admin.view_segment') : tx('admin.view_page_context')}
                        </button>
                    )}
                </div>

                {imageChanged && (
                    <div className="w-full bg-amber-500/90 text-white text-[10px] px-2 py-1 rounded text-center font-medium">
                        ⚠️ {tx('admin.image_changed')}
                    </div>
                )}
            </div>

            {/* Content column */}
            <div className="flex-1 p-5 flex flex-col gap-3">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                            {t.profiles?.display_name?.charAt(0) || t.profiles?.username?.charAt(0) || '?'}
                        </div>
                        <span className="text-xs font-medium text-foreground">
                            {t.profiles?.display_name || t.profiles?.username || tx('admin.unknown')}
                        </span>
                        <span className="text-[10px] text-muted-foreground opacity-60">
                            {new Date(t.submitted_at).toLocaleDateString(lang === 'ar' ? 'ar' : lang === 'fr' ? 'fr-FR' : 'en-US')}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {t.xp_awarded ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20">
                                +{t.xp_awarded} XP
                            </span>
                        ) : null}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${seg.status === 'conflict'
                            ? 'bg-destructive/10 text-destructive border-destructive/20 animate-pulse'
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                            }`}>
                            {seg.status === 'conflict' ? tx('admin.status_conflict_short') : tx('admin.status_review_short')}
                        </span>
                    </div>
                </div>

                {/* Text / edit area */}
                {editingId === t.id ? (
                    <div className="flex flex-col gap-2">
                        <Textarea
                            value={editText}
                            onChange={(e) => onEditTextChange(e.target.value)}
                            dir="rtl"
                            className="font-arabic text-xl leading-loose p-4 resize-none min-h-[100px]"
                        />
                        <div className="text-[11px] text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded border border-amber-200 dark:border-amber-700">
                            {t.status === 'modified'
                                ? tx('admin.correction_xp_note')
                                : tx('admin.edit_xp_note')}
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="outline" onClick={onCancelEdit} disabled={loading === t.id}>
                                {tx('admin.cancel')}
                            </Button>
                            <Button size="sm" onClick={onSaveEdit} disabled={loading === t.id}>
                                <Save className="w-3.5 h-3.5 mr-2" />
                                {tx('admin.edit_and_validate')}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <p className="font-arabic text-2xl leading-loose text-right text-foreground" dir="rtl">
                            {t.text}
                        </p>
                        <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs gap-1.5"
                                onClick={onStartEdit}
                                disabled={loading !== null}
                            >
                                <Edit2 className="w-3 h-3" /> {tx('admin.edit')}
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                                onClick={onReject}
                                disabled={loading !== null}
                            >
                                <Trash2 className="w-3 h-3" /> {tx('admin.reject')}
                            </Button>
                            <Button
                                size="sm"
                                className="h-8 text-xs gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                                onClick={onApprove}
                                disabled={loading !== null}
                            >
                                <Check className="w-3.5 h-3.5" /> {tx('admin.approve')}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

function PendingTab({ initialSegments }: { initialSegments: Segment[] }) {
    const [segments, setSegments] = useState(initialSegments)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editText, setEditText] = useState('')
    const [loading, setLoading] = useState<string | null>(null)
    const { toast } = useToast()
    const { t: tx, lang } = useLanguage()

    const handleApprove = async (segmentId: string, transcriptionId: string, text: string) => {
        setLoading(transcriptionId)
        const result = await approveTranscription(segmentId, transcriptionId, text)
        if (result.success) {
            toast({ title: tx('admin.approved'), description: tx('admin.approval_success') })
            setSegments(prev => prev.filter(s => s.id !== segmentId))
        } else {
            toast({ title: tx('common.error'), description: (result as any).error, variant: "destructive" })
        }
        setLoading(null)
    }

    const handleReject = async (transcriptionId: string) => {
        if (!confirm(tx('admin.reject_confirm'))) return

        setLoading(transcriptionId)
        const result = await rejectTranscription(transcriptionId)
        if (result.success) {
            toast({ title: tx('admin.rejected'), description: tx('admin.rejection_success') })
            setSegments(prev => prev
                .map(s => ({
                    ...s,
                    transcriptions: s.transcriptions.filter((t) => t.id !== transcriptionId)
                }))
                .filter(s => s.transcriptions.length > 0)
            )
        } else {
            toast({ title: tx('common.error'), description: (result as any).error, variant: "destructive" })
        }
        setLoading(null)
    }

    const [selectedIds, setSelectedIds] = useState<string[]>([])

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    }

    const handleBulkReject = async () => {
        if (selectedIds.length === 0) return
        if (!confirm(tx('admin.bulk_reject_confirm', { count: selectedIds.length }))) return

        setLoading('bulk')
        const result = await bulkRejectTranscriptions(selectedIds)
        if (result.success) {
            toast({ title: tx('admin.success'), description: tx('admin.bulk_rejected', { count: selectedIds.length }) })
            setSegments(prev => prev
                .map(s => ({
                    ...s,
                    transcriptions: s.transcriptions.filter((t) => !selectedIds.includes(t.id))
                }))
                .filter(s => s.transcriptions.length > 0)
            )
            setSelectedIds([])
        } else {
            toast({ title: tx('common.error'), description: (result as any).error, variant: "destructive" })
        }
        setLoading(null)
    }

    if (segments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/20 rounded-xl border border-dashed border-border">
                <Check className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <h2 className="text-xl font-semibold text-foreground">{tx('admin.all_verified')}</h2>
                <p className="text-muted-foreground">{tx('admin.no_pending')}</p>
            </div>
        )
    }

    const pendingCount = segments.reduce((sum, seg) => sum + seg.transcriptions.length, 0)
    const multiUserCount = segments.filter(seg => seg.transcriptions.length > 1).length

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                <p className="text-sm text-muted-foreground">
                    {tx('admin.proposals_to_review', { count: pendingCount, segments: segments.length })}
                    {multiUserCount > 0 && (
                        <span className="ml-2 text-amber-700">
                            {tx('admin.segments_multiple_contributors', { count: multiUserCount })}
                        </span>
                    )}
                </p>
                {selectedIds.length > 0 && (
                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <span className="text-xs font-semibold text-primary">{tx('admin.selected_count', { count: selectedIds.length })}</span>
                        <Button 
                            variant="destructive" 
                            size="sm" 
                            className="h-8 gap-2" 
                            onClick={handleBulkReject}
                            disabled={loading === 'bulk'}
                        >
                            {loading === 'bulk' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            {tx('admin.reject_selection')}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8" onClick={() => setSelectedIds([])}>
                            {tx('admin.cancel')}
                        </Button>
                    </div>
                )}
            </div>
            {segments.map((seg) => (
                <div key={seg.id} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-border bg-muted/30 p-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-md border border-border bg-background px-2 py-1 text-xs font-bold">
                                    {seg.manuscripts?.title || tx('admin.unknown_manuscript')} · {tx('transcribe.line')} #{seg.order_index}
                                </span>
                                <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${seg.status === 'conflict'
                                    ? 'border-destructive/20 bg-destructive/10 text-destructive'
                                    : 'border-amber-500/20 bg-amber-500/10 text-amber-700'
                                    }`}>
                                    {seg.status === 'conflict' ? tx('admin.status_conflict_short') : tx('admin.status_review_short')}
                                </span>
                                {seg.transcriptions.length > 1 && (
                                    <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                                        {tx('admin.proposals_count', { count: seg.transcriptions.length })}
                                    </span>
                                )}
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">
                                {tx('admin.compare_same_segment')}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3 p-4">
                        {seg.transcriptions.map((t, transcriptionIndex) => (
                            <div key={t.id} className="relative flex items-start gap-4">
                                <div className="pt-8 pl-1">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 cursor-pointer rounded border-gray-300 text-primary focus:ring-primary"
                                        checked={selectedIds.includes(t.id)}
                                        onChange={() => toggleSelect(t.id)}
                                        aria-label={tx('admin.select_transcription')}
                                    />
                                </div>
                                <div className="flex-1">
                                    <TranscriptionCard
                                        t={t}
                                        seg={seg}
                                        loading={loading}
                                        editingId={editingId}
                                        editText={editText}
                                        onApprove={() => handleApprove(seg.id, t.id, t.text)}
                                        onReject={() => handleReject(t.id)}
                                        onStartEdit={() => { setEditingId(t.id); setEditText(t.text) }}
                                        onCancelEdit={() => setEditingId(null)}
                                        onSaveEdit={() => {
                                            if (!editText.trim()) return
                                            handleApprove(seg.id, t.id, editText)
                                            setEditingId(null)
                                        }}
                                        onEditTextChange={setEditText}
                                    />
                                    <p className="mt-1 text-[10px] text-muted-foreground">
                                        {tx('admin.proposal_submitted', { count: transcriptionIndex + 1 })} {new Date(t.submitted_at).toLocaleString(lang === 'ar' ? 'ar' : lang === 'fr' ? 'fr-FR' : 'en-US')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}

function ValidatedTranscriptionCard({
    seg,
    onUpdate
}: {
    seg: Segment,
    onUpdate: (updatedSeg: Segment) => void
}) {
    const [showContext, setShowContext] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editText, setEditText] = useState(seg.consensus_text || '')
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()
    const { t: tx } = useLanguage()

    const approvedT = seg.transcriptions.find(t => t.is_validated) || seg.transcriptions[0]
    const pageImage = approvedT?.page_image_url || seg.pages?.image_url || null
    const polygon = approvedT?.polygon || seg.polygon || null
    const fallback = approvedT?.image_url || seg.image_url || null

    const handleSave = async () => {
        if (!editText.trim()) return
        setLoading(true)
        const result = await approveTranscription(seg.id, approvedT.id, editText)
        if (result.success) {
            toast({ title: tx('admin.edit'), description: tx('admin.official_updated') })
            onUpdate({ ...seg, consensus_text: editText })
            setIsEditing(false)
        } else {
            toast({ title: tx('common.error'), description: (result as any).error, variant: "destructive" })
        }
        setLoading(false)
    }

    return (
        <div className="bg-card border border-green-500/20 shadow-sm rounded-xl overflow-hidden flex flex-col lg:flex-row group transition-all hover:border-green-500/40">
            {/* Image */}
            <div className="lg:w-2/5 bg-black/5 flex flex-col items-start p-3 border-b lg:border-b-0 lg:border-r border-border relative gap-2">
                <SegmentImageWithPolygon
                    pageImageUrl={pageImage}
                    polygon={polygon}
                    fallbackImageUrl={fallback}
                    showContext={showContext}
                />
                <div className="flex w-full items-center justify-between px-1">
                    <div className="bg-background/80 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold border border-border shadow-sm">
                        {seg.manuscripts?.title} – #{seg.order_index}
                    </div>
                    {pageImage && fallback && (
                        <button
                            onClick={() => setShowContext(!showContext)}
                            className="flex items-center gap-1.5 text-[10px] font-medium text-primary hover:underline"
                        >
                            <ImageIcon className="w-3 h-3" />
                            {showContext ? tx('admin.view_segment') : tx('admin.view_page_context')}
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 border border-green-500/20">
                        ✓ VALIDÉ
                    </span>
                    {seg.consensus_reached_at && (
                        <span className="text-[10px] text-muted-foreground">
                            {new Date(seg.consensus_reached_at).toLocaleDateString('fr-FR')}
                        </span>
                    )}
                </div>

                {isEditing ? (
                    <div className="flex flex-col gap-3">
                        <Textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            dir="rtl"
                            className="font-arabic text-xl leading-loose p-4 resize-none min-h-[100px]"
                        />
                        <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} disabled={loading}>
                                Annuler
                            </Button>
                            <Button size="sm" onClick={handleSave} disabled={loading}>
                                {loading ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-2" />}
                                Enregistrer
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <p className="font-arabic text-2xl leading-loose text-right text-foreground" dir="rtl">
                            {seg.consensus_text}
                        </p>
                        <div className="flex gap-2 justify-end mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs gap-1.5"
                                onClick={() => { setIsEditing(true); setEditText(seg.consensus_text || '') }}
                                disabled={loading}
                            >
                                <Edit2 className="w-3 h-3" /> {tx('admin.edit')}
                            </Button>
                        </div>
                    </>
                )}

                {approvedT && !isEditing && (
                    <div className="flex items-center gap-2 mt-1 py-1 border-t border-border/50">
                        <div className="w-4 h-4 rounded-full bg-green-500/10 flex items-center justify-center text-[8px] font-bold text-green-700">
                            {approvedT.profiles?.display_name?.charAt(0) || approvedT.profiles?.username?.charAt(0) || '?'}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                            {tx('transcribe.transcription_of')} {approvedT.profiles?.display_name || approvedT.profiles?.username || tx('admin.unknown')}
                        </span>
                        {approvedT.xp_awarded ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/5 text-primary/70 border border-primary/10 ml-auto">
                                +{approvedT.xp_awarded} XP
                            </span>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    )
}

function ValidatedTab() {
    const [loaded, setLoaded] = useState(false)
    const [loading, setLoading] = useState(false)
    const [segments, setSegments] = useState<Segment[]>([])
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const LIMIT = 20
    const { t: tx } = useLanguage()

    const loadPage = async (p: number) => {
        setLoading(true)
        const data = await getValidatedSegments(p, LIMIT)
        if (p === 0) setSegments(data)
        else setSegments(prev => [...prev, ...data])
        setHasMore(data.length === LIMIT)
        setLoaded(true)
        setLoading(false)
    }

    const handleLoad = () => {
        loadPage(0)
        setPage(0)
    }

    const handleLoadMore = () => {
        const next = page + 1
        setPage(next)
        loadPage(next)
    }

    const handleUpdateSegment = (updatedSeg: Segment) => {
        setSegments(prev => prev.map(s => s.id === updatedSeg.id ? updatedSeg : s))
    }

    if (!loaded) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center bg-muted/10 rounded-xl border border-dashed border-border">
                <History className="w-10 h-10 text-muted-foreground/30" />
                <p className="text-muted-foreground text-sm">{tx('admin.validation_history_load')}</p>
                <Button variant="outline" onClick={handleLoad} disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ChevronDown className="w-4 h-4 mr-2" />}
                    {tx('admin.load_validations')}
                </Button>
            </div>
        )
    }

    if (segments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-muted/10 rounded-xl border border-dashed border-border">
                <ClipboardCheck className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">{tx('admin.no_validated_transcriptions')}</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">{tx('admin.loaded_segments', { count: segments.length })}</p>
            {segments.map(seg => (
                <ValidatedTranscriptionCard
                    key={seg.id}
                    seg={seg}
                    onUpdate={handleUpdateSegment}
                />
            ))}
            {hasMore && (
                <div className="flex justify-center pt-2">
                    <Button variant="outline" onClick={handleLoadMore} disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ChevronDown className="w-4 h-4 mr-2" />}
                        {tx('admin.load_more')}
                    </Button>
                </div>
            )}
        </div>
    )
}

export function VerifyPageClient({ initialSegments }: { initialSegments: Segment[] }) {
    const [activeTab, setActiveTab] = useState<'pending' | 'validated'>('pending')
    const { t: tx, lang } = useLanguage()

    const pendingCount = initialSegments.reduce((sum, s) => sum + s.transcriptions.length, 0)

    return (
        <div className="flex flex-col gap-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-muted/40 rounded-lg w-fit border border-border">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'pending'
                        ? 'bg-background shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <AlertCircle className="w-4 h-4" />
                    {tx('admin.status_review_short')}
                    {pendingCount > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full">
                            {pendingCount}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('validated')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'validated'
                        ? 'bg-background shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <ClipboardCheck className="w-4 h-4" />
                    {tx('admin.validated_history')}
                </button>
            </div>

            {/* Tab content */}
            {activeTab === 'pending' ? (
                <PendingTab initialSegments={initialSegments} />
            ) : (
                <ValidatedTab />
            )}
        </div>
    )
}
