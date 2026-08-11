'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    Sheet,
    SheetContent,
} from "@/components/ui/sheet"
import { ChevronRight, FileText, List, CheckCircle2, Loader2, BookOpen } from 'lucide-react'
import { getManuscriptPages, getPageSegments } from './actions'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

interface ManuscriptNavigationProps {
    manuscriptId: string;
    isOpen: boolean;
    onClose: () => void;
    onSelectSegment: (segmentId: string) => void;
    currentSegmentId?: string;
    currentPageId?: string;
    t: (key: string) => string;
    isSidebar?: boolean;
}

export function ManuscriptNavigation({
    manuscriptId,
    isOpen,
    onClose,
    onSelectSegment,
    currentSegmentId,
    currentPageId,
    t,
    isSidebar = false
}: ManuscriptNavigationProps) {
    const [pages, setPages] = useState<any[]>([])
    const [selectedPageId, setSelectedPageId] = useState<string | null>(currentPageId || null)
    const [segments, setSegments] = useState<any[]>([])
    const [loadingPages, setLoadingPages] = useState(false)
    const [loadingSegments, setLoadingSegments] = useState(false)

    const loadPages = useCallback(async () => {
        setLoadingPages(true)
        try {
            const data = await getManuscriptPages(manuscriptId)
            setPages(data)
        } catch (err) {
            console.error('Failed to load pages', err)
        } finally {
            setLoadingPages(false)
        }
    }, [manuscriptId])

    const loadSegments = useCallback(async (pageId: string) => {
        setLoadingSegments(true)
        try {
            const data = await getPageSegments(pageId)
            setSegments(data)
        } catch (err) {
            console.error('Failed to load segments', err)
        } finally {
            setLoadingSegments(false)
        }
    }, [])

    useEffect(() => {
        if (isOpen && manuscriptId) {
            loadPages()
        }
    }, [isOpen, manuscriptId, loadPages])

    useEffect(() => {
        if (selectedPageId) {
            loadSegments(selectedPageId)
        }
    }, [selectedPageId, loadSegments])

    useEffect(() => {
        if (currentPageId && currentPageId !== selectedPageId) {
            setSelectedPageId(currentPageId)
        }
    }, [currentPageId, selectedPageId])

    const content = (
        <div className={`flex flex-col gap-0 h-full ${isSidebar ? 'w-full border-r border-border/50 bg-background' : 'w-full'}`}>
            <div className="p-6 border-b border-border/50 bg-muted/20 shrink-0">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-primary">
                        <BookOpen className="w-5 h-5" />
                        <h2 className="text-xl font-heading font-semibold">
                            {t('transcribe.navigation_title')}
                        </h2>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground">
                    {t('transcribe.navigation_desc')}
                </p>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Pages List */}
                <div className="w-24 min-w-[96px] border-r border-border/50 bg-muted/5 flex flex-col">
                    <div className="p-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50 bg-background/50">
                        {t('transcribe.pages')}
                    </div>
                    <ScrollArea className="flex-1">
                        {loadingPages ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="w-5 h-5 animate-spin text-primary/50" />
                            </div>
                        ) : (
                            <div className="p-2 grid grid-cols-1 gap-1">
                                {pages.map((page) => (
                                    <button
                                        key={page.id}
                                        onClick={() => setSelectedPageId(page.id)}
                                        className={`w-full flex items-center justify-center p-2 rounded-lg transition-all border ${selectedPageId === page.id ? 'bg-primary/10 border-primary text-primary shadow-sm' : 'hover:bg-muted border-transparent text-muted-foreground'}`}
                                        title={`${t('transcribe.pages')} ${page.order_index}`}
                                    >
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="w-10 h-12 rounded border border-current/20 bg-background/50 overflow-hidden flex items-center justify-center shrink-0">
                                                {page.image_url ? (
                                                    <img src={page.image_url} alt={`P${page.order_index}`} className="w-full h-full object-cover opacity-80" />
                                                ) : (
                                                    <FileText className="w-5 h-5 opacity-30" />
                                                )}
                                            </div>
                                            <span className="text-[10px] font-bold">P{page.order_index}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>

                {/* Segments (Lines) List */}
                <div className="flex-1 flex flex-col bg-background">
                    <div className="p-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50 flex justify-between items-center bg-background">
                        {t('transcribe.lines')}
                        {selectedPageId && (
                            <Badge variant="outline" className="text-[9px] h-4 px-1">
                                {segments.length}
                            </Badge>
                        )}
                    </div>
                    <ScrollArea className="flex-1">
                        {!selectedPageId ? (
                            <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-4 opacity-40">
                                <ChevronRight className="w-12 h-12 rotate-180" />
                                <p className="text-sm font-medium">{t('transcribe.select_page')}</p>
                            </div>
                        ) : loadingSegments ? (
                            <div className="flex justify-center p-12">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="p-3 flex flex-col gap-2">
                                {segments.map((seg) => (
                                    <button
                                        key={seg.id}
                                        onClick={() => onSelectSegment(seg.id)}
                                        className={`w-full flex items-center justify-between p-2 rounded-lg border transition-all text-right group ${currentSegmentId === seg.id ? 'bg-primary/10 border-primary shadow-sm' : 'bg-card hover:bg-muted border-border/50 shadow-inner'}`}
                                    >
                                        <div className="flex flex-col items-start gap-0.5">
                                            <span className={`text-[9px] font-bold uppercase tracking-tighter ${currentSegmentId === seg.id ? 'text-primary' : 'text-muted-foreground'}`}>
                                                {t('transcribe.line')} {seg.order_index}
                                            </span>
                                            <div className="flex gap-1 flex-wrap">
                                                {seg.status === 'validated' && (
                                                    <Badge variant="secondary" className="bg-success/10 text-success border-success/20 text-[9px] h-4">
                                                        {t('transcribe.validated_short')}
                                                    </Badge>
                                                )}
                                                {seg.is_done_by_me && (
                                                    <div className="flex items-center gap-1 text-[9px] font-bold text-success">
                                                        <CheckCircle2 className="w-3 h-3" /> {t('transcribe.done')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className={`p-1 rounded-full transition-transform group-hover:translate-x-0.5 ${currentSegmentId === seg.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                            <ChevronRight className="w-3 h-3" />
                                        </div>
                                    </button>
                                ))}
                                {segments.length === 0 && (
                                    <div className="py-20 text-center text-muted-foreground opacity-50 flex flex-col items-center gap-2">
                                        <List className="w-8 h-8 opacity-20" />
                                        <p className="text-xs">Aucun segment</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </div>
        </div>
    );

    if (isSidebar) {
        return content;
    }

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent side="right" className="w-[350px] sm:w-[500px] p-0 flex flex-col gap-0 border-l border-border/50 shadow-2xl">
                {content}
            </SheetContent>
        </Sheet>
    )
}
