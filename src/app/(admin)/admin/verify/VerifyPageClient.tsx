'use client'

import { useState, useRef, useEffect } from 'react'
import { approveTranscription, rejectTranscription, getValidatedSegments } from './actions'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
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
function SegmentImageWithPolygon({
    pageImageUrl,
    polygon,
    fallbackImageUrl,
}: {
    pageImageUrl?: string | null
    polygon?: any
    fallbackImageUrl?: string | null
}) {
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

    if (pageImageUrl) {
        return (
            <div ref={containerRef} className="relative w-full">
                <img
                    src={pageImageUrl}
                    alt="Page du manuscrit"
                    className="w-full max-h-[320px] object-contain rounded-sm shadow"
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
                        {/* Darken everything outside polygon */}
                        <rect
                            width={imgSize.width}
                            height={imgSize.height}
                            fill="rgba(0,0,0,0.55)"
                            mask={`url(#mask-${polygon[0]?.x})`}
                        />
                        {/* Highlight outline */}
                        <polygon
                            points={polygon.map((p: any) => `${p.x},${p.y}`).join(' ')}
                            fill="none"
                            stroke="rgba(255,200,0,0.9)"
                            strokeWidth="2"
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
                alt="Segment"
                className="w-full max-h-[320px] object-contain rounded-sm shadow"
            />
        )
    }

    return (
        <div className="flex flex-col items-center gap-2 text-muted-foreground opacity-30 py-8">
            <ImageIcon className="w-10 h-10" />
            <span className="text-xs">Pas d'image</span>
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
    // Priority: use the page_image_url + polygon stored at submission time (exact same view as contributor)
    // Fall back to: current segment page, then segment crop
    const pageImage = t.page_image_url || seg.pages?.image_url || null
    const polygon = t.polygon || seg.polygon || null
    const fallback = t.image_url || seg.image_url || null

    // If the image shown to contributor differs from current segment image, warn admin
    const imageChanged = (t.page_image_url && seg.pages?.image_url && t.page_image_url !== seg.pages?.image_url)

    return (
        <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm flex flex-col lg:flex-row group hover:border-primary/30 transition-colors">
            {/* Image column — same view as contributor */}
            <div className="lg:w-2/5 bg-black/5 flex flex-col items-start justify-start p-3 border-b lg:border-b-0 lg:border-r border-border relative gap-2">
                <SegmentImageWithPolygon
                    pageImageUrl={pageImage}
                    polygon={polygon}
                    fallbackImageUrl={fallback}
                />
                <div className="absolute top-2 left-2 bg-background/80 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold border border-border shadow-sm">
                    {seg.manuscripts?.title} – #{seg.order_index}
                </div>
                {imageChanged && (
                    <div className="w-full bg-amber-500/90 text-white text-[10px] px-2 py-1 rounded text-center font-medium">
                        ⚠️ Image modifiée depuis la soumission
                    </div>
                )}
                <p className="text-[10px] text-muted-foreground text-center w-full opacity-60">
                    Vue identique à celle du contributeur
                </p>
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
                            {t.profiles?.display_name || t.profiles?.username || 'Inconnu'}
                        </span>
                        <span className="text-[10px] text-muted-foreground opacity-60">
                            {new Date(t.submitted_at).toLocaleDateString('fr-FR')}
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
                            {seg.status === 'conflict' ? 'CONFLIT' : 'EN ATTENTE'}
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
                            Modifier le texte retirera 1/4 des XP attribués au contributeur.
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="outline" onClick={onCancelEdit} disabled={loading === t.id}>
                                Annuler
                            </Button>
                            <Button size="sm" onClick={onSaveEdit} disabled={loading === t.id}>
                                <Save className="w-3.5 h-3.5 mr-2" />
                                Modifier et Valider
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
                                <Edit2 className="w-3 h-3" /> Modifier
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                                onClick={onReject}
                                disabled={loading !== null}
                            >
                                <Trash2 className="w-3 h-3" /> Refuser
                            </Button>
                            <Button
                                size="sm"
                                className="h-8 text-xs gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                                onClick={onApprove}
                                disabled={loading !== null}
                            >
                                <Check className="w-3.5 h-3.5" /> Valider
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

    const handleApprove = async (segmentId: string, transcriptionId: string, text: string) => {
        setLoading(transcriptionId)
        const result = await approveTranscription(segmentId, transcriptionId, text)
        if (result.success) {
            toast({ title: "Validé !", description: "La transcription a été approuvée comme officielle." })
            setSegments(prev => prev.filter(s => s.id !== segmentId))
        } else {
            toast({ title: "Erreur", description: (result as any).error, variant: "destructive" })
        }
        setLoading(null)
    }

    const handleReject = async (transcriptionId: string) => {
        if (!confirm("Voulez-vous vraiment refuser cette transcription ? Les XP du contributeur seront retirés.")) return

        setLoading(transcriptionId)
        const result = await rejectTranscription(transcriptionId)
        if (result.success) {
            toast({ title: "Refusé", description: "La transcription a été supprimée et les XP retirés." })
            setSegments(prev => prev
                .map(s => ({
                    ...s,
                    transcriptions: s.transcriptions.filter((t) => t.id !== transcriptionId)
                }))
                .filter(s => s.transcriptions.length > 0)
            )
        } else {
            toast({ title: "Erreur", description: (result as any).error, variant: "destructive" })
        }
        setLoading(null)
    }

    if (segments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/20 rounded-xl border border-dashed border-border">
                <Check className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <h2 className="text-xl font-semibold text-foreground">Tout est vérifié !</h2>
                <p className="text-muted-foreground">Il n'y a plus de transcriptions en attente de validation.</p>
            </div>
        )
    }

    // One card per transcription
    const allCards = segments.flatMap(seg =>
        seg.transcriptions.map(t => ({ t, seg }))
    )

    return (
        <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
                {allCards.length} proposition{allCards.length > 1 ? 's' : ''} à vérifier (sur {segments.length} segment{segments.length > 1 ? 's' : ''})
            </p>
            {allCards.map(({ t, seg }) => (
                <TranscriptionCard
                    key={t.id}
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
            ))}
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

    if (!loaded) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center bg-muted/10 rounded-xl border border-dashed border-border">
                <History className="w-10 h-10 text-muted-foreground/30" />
                <p className="text-muted-foreground text-sm">Cliquez pour charger l'historique des validations</p>
                <Button variant="outline" onClick={handleLoad} disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ChevronDown className="w-4 h-4 mr-2" />}
                    Charger les validations
                </Button>
            </div>
        )
    }

    if (segments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-muted/10 rounded-xl border border-dashed border-border">
                <ClipboardCheck className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">Aucune transcription validée pour l'instant.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">{segments.length} segment{segments.length > 1 ? 's' : ''} validé{segments.length > 1 ? 's' : ''} (chargés)</p>
            {segments.map(seg => {
                const approvedT = seg.transcriptions.find(t => t.is_validated) || seg.transcriptions[0]
                const pageImage = approvedT?.page_image_url || seg.pages?.image_url || null
                const polygon = approvedT?.polygon || seg.polygon || null
                const fallback = approvedT?.image_url || seg.image_url || null
                return (
                    <div key={seg.id} className="bg-card border border-green-500/20 shadow-sm rounded-xl overflow-hidden flex flex-col lg:flex-row">
                        {/* Image */}
                        <div className="lg:w-2/5 bg-black/5 flex flex-col items-start p-3 border-b lg:border-b-0 lg:border-r border-border relative gap-2">
                            <SegmentImageWithPolygon
                                pageImageUrl={pageImage}
                                polygon={polygon}
                                fallbackImageUrl={fallback}
                            />
                            <div className="absolute top-2 left-2 bg-background/80 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold border border-border shadow-sm">
                                {seg.manuscripts?.title} – #{seg.order_index}
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
                            <p className="font-arabic text-2xl leading-loose text-right text-foreground" dir="rtl">
                                {seg.consensus_text}
                            </p>
                            {approvedT && (
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center text-[10px] font-bold text-green-700">
                                        {approvedT.profiles?.display_name?.charAt(0) || approvedT.profiles?.username?.charAt(0) || '?'}
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {approvedT.profiles?.display_name || approvedT.profiles?.username || 'Inconnu'}
                                    </span>
                                    {approvedT.xp_awarded ? (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20 ml-auto">
                                            +{approvedT.xp_awarded} XP
                                        </span>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
            {hasMore && (
                <div className="flex justify-center pt-2">
                    <Button variant="outline" onClick={handleLoadMore} disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ChevronDown className="w-4 h-4 mr-2" />}
                        Charger plus
                    </Button>
                </div>
            )}
        </div>
    )
}

export function VerifyPageClient({ initialSegments }: { initialSegments: Segment[] }) {
    const [activeTab, setActiveTab] = useState<'pending' | 'validated'>('pending')

    const pendingCount = initialSegments.reduce((sum, s) => sum + s.transcriptions.length, 0)

    return (
        <div className="flex flex-col gap-6">
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
                    À vérifier
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
                    Validations effectuées
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
