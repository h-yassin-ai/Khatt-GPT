'use client'

import { useState } from 'react'
import { approveTranscription, rejectTranscription } from './actions'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Check, X, Edit2, Save, Trash2, AlertCircle, ImageIcon } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

export function VerifyPageClient({ initialSegments }: { initialSegments: any[] }) {
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
            // Remove the segment from the list as it's now validated
            setSegments(prev => prev.filter(s => s.id !== segmentId))
        } else {
            toast({ title: "Erreur", description: result.error, variant: "destructive" })
        }
        setLoading(null)
    }

    const handleReject = async (transcriptionId: string) => {
        if (!confirm("Voulez-vous vraiment supprimer cette transcription ?")) return
        
        setLoading(transcriptionId)
        const result = await rejectTranscription(transcriptionId)
        if (result.success) {
            toast({ title: "Refusé", description: "La transcription a été supprimée." })
            // Refresh local state: remove the transcription from the segment's list
            setSegments(prev => prev.map(s => ({
                ...s,
                transcriptions: s.transcriptions.filter((t: any) => t.id !== transcriptionId)
            })).filter(s => s.transcriptions.length > 0))
        } else {
            toast({ title: "Erreur", description: result.error, variant: "destructive" })
        }
        setLoading(null)
    }

    const startEditing = (id: string, text: string) => {
        setEditingId(id)
        setEditText(text)
    }

    const handleSaveAndApprove = async (segmentId: string, transcriptionId: string) => {
        if (!editText.trim()) return
        await handleApprove(segmentId, transcriptionId, editText)
        setEditingId(null)
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

    return (
        <div className="flex flex-col gap-6">
            {segments.map((seg) => (
                <div key={seg.id} className="bg-card border border-border shadow-sm rounded-xl overflow-hidden flex flex-col lg:flex-row">
                    {/* Left: Segment Image */}
                    <div className="lg:w-1/3 bg-black/5 flex items-center justify-center p-4 min-h-[200px] border-b lg:border-b-0 lg:border-r border-border relative">
                        {seg.image_url ? (
                            <img src={seg.image_url} alt="Segment" className="max-w-full max-h-[300px] object-contain shadow-lg rounded-sm" />
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground opacity-30">
                                <ImageIcon className="w-10 h-10" />
                                <span className="text-xs">No image</span>
                            </div>
                        )}
                        <div className="absolute top-2 left-2 bg-background/80 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold border border-border shadow-sm">
                            {seg.manuscripts?.title} - #{seg.order_index}
                        </div>
                    </div>

                    {/* Right: Transcriptions List */}
                    <div className="flex-1 p-6 flex flex-col gap-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" /> {seg.transcriptions.length} Proposition{seg.transcriptions.length > 1 ? 's' : ''}
                            </h3>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${seg.status === 'conflict' ? 'bg-destructive/10 text-destructive border-destructive/20 animate-pulse' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}>
                                {seg.status === 'conflict' ? 'CONFLIT' : 'EN ATTENTE'}
                            </span>
                        </div>

                        <div className="space-y-4">
                            {seg.transcriptions.map((t: any) => (
                                <div key={t.id} className="p-4 rounded-lg border border-border bg-muted/30 flex flex-col gap-3 group hover:border-primary/30 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                                {t.profiles?.display_name?.charAt(0) || t.profiles?.username?.charAt(0) || '?'}
                                            </div>
                                            <span className="text-xs font-medium text-foreground">
                                                {t.profiles?.display_name || t.profiles?.username || 'Unknown'}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground opacity-60">
                                                {new Date(t.submitted_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    {editingId === t.id ? (
                                        <div className="flex flex-col gap-2">
                                            <Textarea 
                                                value={editText}
                                                onChange={(e) => setEditText(e.target.value)}
                                                dir="rtl"
                                                className="font-arabic text-xl leading-loose p-4 resize-none min-h-[100px]"
                                            />
                                            <div className="flex gap-2 justify-end">
                                                <Button size="sm" variant="outline" onClick={() => setEditingId(null)} disabled={loading === t.id}>
                                                    Annuler
                                                </Button>
                                                <Button size="sm" onClick={() => handleSaveAndApprove(seg.id, t.id)} disabled={loading === t.id}>
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
                                                    onClick={() => startEditing(t.id, t.text)}
                                                    disabled={loading !== null}
                                                >
                                                    <Edit2 className="w-3 h-3" /> Modifier
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    className="h-8 text-xs gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20" 
                                                    onClick={() => handleReject(t.id)}
                                                    disabled={loading !== null}
                                                >
                                                    <Trash2 className="w-3 h-3" /> Refuser
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    className="h-8 text-xs gap-1.5 bg-green-600 hover:bg-green-700 text-white" 
                                                    onClick={() => handleApprove(seg.id, t.id, t.text)}
                                                    disabled={loading !== null}
                                                >
                                                    <Check className="w-3.5 h-3.5" /> Valider
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
