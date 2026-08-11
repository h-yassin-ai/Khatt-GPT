'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/lib/language-context'
import { resolveConflict } from './actions'
import { CheckCircle2, User, RefreshCw } from 'lucide-react'
import * as Diff from 'diff'

export default function ConflictResolver({ segment, manuscriptId }: { segment: any, manuscriptId: string }) {
    const { toast } = useToast()
    const { t, lang } = useLanguage()
    const [submitting, setSubmitting] = useState(false)

    // Sort transcriptions by creation
    const transcriptions = [...(segment.transcriptions || [])].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    // Final consensus text starts as the first transcription's text (or empty)
    const [finalText, setFinalText] = useState(transcriptions.length > 0 ? transcriptions[0].text : '')

    // For diffing, we compare each transcription's text against the current `finalText`
    // to see how it diverges from the admin's working version.

    async function handleResolve() {
        if (!finalText.trim()) {
            toast({ title: t('common.error'), description: t('admin.consensus_empty'), variant: 'destructive' })
            return
        }
        setSubmitting(true)
        const res = await resolveConflict(segment.id, finalText, manuscriptId)
        setSubmitting(false)

        if (res.error) {
            toast({ title: t('admin.failed_resolve'), description: res.error, variant: 'destructive' })
        } else {
            toast({ title: t('admin.conflict_resolved'), description: t('admin.segment_validated') })
        }
    }

    return (
        <div className="bg-card border border-border/50 shadow-sm rounded-xl overflow-hidden flex flex-col md:flex-row" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            {/* Image Side */}
            <div className="w-full md:w-1/3 bg-muted border-b md:border-b-0 md:border-r border-border/50 relative min-h-[200px] flex items-center justify-center p-4">
                {segment.image_url ? (
                    <img
                        src={segment.image_url || undefined}
                        alt={`Segment ${segment.order_index}`}
                        className="max-h-[300px] w-auto object-contain rounded-md shadow-sm bg-white"
                        loading="lazy"
                    />
                ) : (
                    <span className="text-muted-foreground">{t('admin.no_image')}</span>
                )}
                <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded text-xs text-foreground font-mono shadow-sm">
                    Seg #{segment.order_index}
                </div>
            </div>

            {/* Resolution Side */}
            <div className="w-full md:w-2/3 p-6 flex flex-col gap-6">
                <div>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <span className="text-foreground">{t('admin.merged_consensus')}</span>
                        <span className="text-xs font-normal text-muted-foreground">{t('admin.edit_finalize')}</span>
                    </h3>
                    <Textarea
                        value={finalText}
                        onChange={(e) => setFinalText(e.target.value)}
                        className="w-full min-h-[120px] font-arabic text-right text-2xl bg-background border-border"
                        dir="rtl"
                    />
                    <div className="mt-3 flex justify-end">
                        <Button onClick={handleResolve} disabled={submitting || !finalText.trim()} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                            {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {submitting ? t('admin.resolving') : t('admin.confirm_resolution')}
                        </Button>
                    </div>
                </div>

                <div className="border-t border-border/50 pt-6">
                <h3 className="text-sm font-semibold mb-4 text-foreground">{t('admin.submitted_count', { count: transcriptions.length })}</h3>
                    <div className="space-y-4">
                        {transcriptions.map((submission: any) => {
                            // Compute diff between 'finalText' (what admin is building) and 't.text' (what user submitted)
                            // We treat 'finalText' as new, 't.text' as old.
                            // However, since it's RTL Arabic, diffing outputs left-to-right nodes unless we are careful.
                            // The diff structure gives arrays of {value, added, removed}.
                            const differences = Diff.diffChars(finalText, submission.text)

                            return (
                                <div key={submission.id} className="bg-background border border-border/50 rounded-md p-4 shadow-sm">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <div className="w-6 h-6 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                                                <User className="w-3 h-3" />
                                            </div>
                        <span className="font-medium text-foreground">{submission.profiles?.display_name || t('admin.anonymous')}</span>
                                            <span className="text-xs opacity-70">
                                                {new Date(submission.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-xs h-7 px-2"
                                            onClick={() => setFinalText(submission.text)}
                                        >
                                            Use as Base
                                        </Button>
                                    </div>

                                    {/* Diff Visualizer */}
                                    <div className="p-3 bg-muted/30 border border-border/30 rounded font-arabic text-xl text-right leading-relaxed mt-2" dir="rtl">
                                        {differences.map((part, idx) => {
                                            if (part.added) {
                                                // present in contributor's text but missing in admin text
                                                return <span key={idx} className="bg-destructive/20 text-destructive">{part.value}</span>
                                            }
                                            if (part.removed) {
                                                // missing in contributor's text but present in admin text
                                                return <span key={idx} className="bg-success/20 text-success line-through opacity-70">{part.value}</span>
                                            }
                                            // matching
                                            return <span key={idx} className="text-foreground">{part.value}</span>
                                        })}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-2 flex gap-4">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive/50"></span> {t('admin.contributor_added')}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success/50"></span> {t('admin.contributor_missing')}</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
