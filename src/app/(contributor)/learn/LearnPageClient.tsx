'use client'

import { GraduationCap, ShieldCheck, AlertTriangle, BookOpen, Search } from 'lucide-react'
import Zoom from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'
import Link from 'next/link'
import { useLanguage } from '@/lib/language-context'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

type Segment = {
    id: string
    image_url: string | null
    consensus_text: string | null
    status: string
    order_index: number
    manuscripts: { title: string } | { title: string }[]
}

export function LearnPageClient({ segments, initialQuery }: { segments: Segment[]; initialQuery: string }) {
    const { t } = useLanguage()
    const router = useRouter()
    const [query, setQuery] = useState(initialQuery)

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        const params = query.trim() ? `?query=${encodeURIComponent(query.trim())}` : ''
        router.push(`/learn${params}`)
    }

    return (
        <div className="flex flex-col gap-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-heading font-bold text-foreground flex items-center gap-3 mb-2">
                        <GraduationCap className="w-8 h-8 text-primary" /> {t('learn.title')}
                    </h1>
                    <p className="text-muted-foreground w-full max-w-xl">
                        {t('learn.desc')}
                    </p>
                </div>

                <form onSubmit={handleSearch} className="w-full md:w-auto flex items-center relative">
                    <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t('learn.search')}
                        className="w-full md:w-64 pl-9 pr-4 py-2 rounded-full border border-border bg-card shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-arabic"
                        dir="rtl"
                    />
                </form>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                    <ShieldCheck className="w-4 h-4 text-green-600" />
                    <span className="text-green-700 font-medium">{t('learn.validated')}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <span className="text-orange-600 font-medium">{t('learn.unvalidated')}</span>
                </div>
            </div>

            {/* Segments list */}
            <div className="grid grid-cols-1 gap-5">
                {segments.length > 0 ? (
                    segments.map(seg => {
                        const isValidated = seg.status === 'validated'
                        const manuscriptTitle = Array.isArray(seg.manuscripts)
                            ? seg.manuscripts[0]?.title
                            : (seg.manuscripts as any)?.title ?? 'Unknown Source'

                        return (
                            <div
                                key={seg.id}
                                className="bg-card border border-border shadow-sm rounded-xl overflow-hidden flex flex-col md:flex-row group hover:border-primary/40 transition-colors"
                            >
                                {/* Image */}
                                <div className="w-full md:w-1/3 bg-muted border-r border-border p-4 flex items-center justify-center relative min-h-[140px]">
                                    {seg.image_url ? (
                                        <Zoom>
                                            <img
                                                src={seg.image_url}
                                                alt="Segment du manuscrit"
                                                className="max-w-full max-h-44 object-contain rounded drop-shadow-sm"
                                            />
                                        </Zoom>
                                    ) : (
                                        <BookOpen className="w-8 h-8 text-muted-foreground opacity-20" />
                                    )}
                                    <div className="absolute top-2 left-2 text-[10px] font-bold text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded border border-border">
                                        #{seg.order_index}
                                    </div>
                                </div>

                                {/* Text side */}
                                <div className="w-full md:w-2/3 p-5 flex flex-col justify-between gap-3">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                                                {t('learn.source')}: {manuscriptTitle}
                                            </span>
                                            {/* Validation badge */}
                                            {isValidated ? (
                                                <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-500/10 text-green-700 border border-green-500/20 shrink-0">
                                                    <ShieldCheck className="w-3.5 h-3.5" />
                                                    {t('learn.validated')}
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-600 border border-orange-500/20 shrink-0">
                                                    <AlertTriangle className="w-3.5 h-3.5" />
                                                    {t('learn.in_progress')}
                                                </span>
                                            )}
                                        </div>

                                        <p className="font-arabic text-2xl leading-[2.2] text-foreground text-right" dir="rtl">
                                            {seg.consensus_text}
                                        </p>
                                    </div>

                                    {/* Warning for unvalidated */}
                                    {!isValidated && (
                                        <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-500/8 border border-orange-500/20 text-orange-700 text-xs leading-relaxed">
                                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                            <span>{t('learn.unvalidated')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="bg-card border border-border border-dashed p-12 rounded-xl text-center flex flex-col items-center justify-center text-muted-foreground">
                        <GraduationCap className="w-12 h-12 mb-4 opacity-30" />
                        <h2 className="text-xl font-heading font-semibold text-foreground mb-2">{t('learn.no_segments')}</h2>
                        <Link href="/transcribe" className="mt-6 bg-primary text-primary-foreground px-6 py-2 rounded-full font-semibold shadow hover:bg-primary/90 transition-all text-sm">
                            {t('browse.go_transcribe')}
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
