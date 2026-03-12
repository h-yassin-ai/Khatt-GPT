'use client'

import { useState, useEffect } from 'react'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
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
}

export function ManuscriptNavigation({
    manuscriptId,
    isOpen,
    onClose,
    onSelectSegment,
    currentSegmentId,
    currentPageId,
    t
}: ManuscriptNavigationProps) {
    const [pages, setPages] = useState<any[]>([])
    const [selectedPageId, setSelectedPageId] = useState<string | null>(currentPageId || null)
    const [segments, setSegments] = useState<any[]>([])
    const [loadingPages, setLoadingPages] = useState(false)
    const [loadingSegments, setLoadingSegments] = useState(false)

    useEffect(() => {
        if (isOpen && manuscriptId) {
            loadPages()
        }
    }, [isOpen, manuscriptId])

    useEffect(() => {
        if (selectedPageId) {
            loadSegments(selectedPageId)
        }
    }, [selectedPageId])
    
    useEffect(() => {
        if (currentPageId && !selectedPageId) {
            setSelectedPageId(currentPageId)
        }
    }, [currentPageId])

    const loadPages = async () => {
        setLoadingPages(true)
        try {
            const data = await getManuscriptPages(manuscriptId)
            setPages(data)
        } catch (err) {
            console.error('Failed to load pages', err)
        } finally {
            setLoadingPages(false)
        }
    }

    const loadSegments = async (pageId: string) => {
        setLoadingSegments(true)
        try {
            const data = await getPageSegments(pageId)
            setSegments(data)
        } catch (err) {
            console.error('Failed to load segments', err)
        } finally {
            setLoadingSegments(false)
        }
    }

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent side="right" className="w-[350px] sm:w-[500px] p-0 flex flex-col gap-0 border-l border-border/50 shadow-2xl">
                <SheetHeader className="p-6 border-b border-border/50 bg-muted/20">
                    <div className="flex items-center gap-2 text-primary mb-1">
                        <BookOpen className="w-5 h-5" />
                        <SheetTitle className="text-xl font-heading font-semibold">
                            {t('transcribe.navigation_title') || 'Navigation Manuscrit'}
                        </SheetTitle>
                    </div>
                    <SheetDescription className="text-sm">
                        {t('transcribe.navigation_desc') || 'Choisissez une page et une ligne à transcrire.'}
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 flex overflow-hidden">
                    {/* Pages List */}
                    <div className="w-1/3 border-r border-border/50 bg-muted/5 flex flex-col">
                        <div className="p-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50 bg-background/50">
                            Pages
                        </div>
                        <ScrollArea className="flex-1">
                            {loadingPages ? (
                                <div className="flex justify-center p-8">
                                    <Loader2 className="w-5 h-5 animate-spin text-primary/50" />
                                </div>
                            ) : (
                                <div className="p-2 flex flex-col gap-1">
                                    {pages.map((page) => (
                                        <button
                                            key={page.id}
                                            onClick={() => setSelectedPageId(page.id)}
                                            className={`w-full flex flex-col items-center gap-2 p-3 rounded-lg transition-all border ${selectedPageId === page.id ? 'bg-primary text-primary-foreground border-primary shadow-md' : 'hover:bg-muted border-transparent text-muted-foreground'}`}
                                        >
                                            <div className="w-12 h-16 rounded border border-current/20 bg-background/50 overflow-hidden flex items-center justify-center shrink-0">
                                                {page.image_url ? (
                                                    <img src={page.image_url} alt={`P${page.order_index}`} className="w-full h-full object-cover opacity-80" />
                                                ) : (
                                                    <FileText className="w-6 h-6 opacity-30" />
                                                )}
                                            </div>
                                            <span className="text-xs font-bold">Page {page.order_index}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>

                    {/* Segments (Lines) List */}
                    <div className="flex-1 flex flex-col bg-background">
                        <div className="p-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50 flex justify-between items-center bg-background">
                            Lignes (Segments)
                            {selectedPageId && (
                                <Badge variant="outline" className="text-[9px] h-4 px-1">
                                    {segments.length} total
                                </Badge>
                            )}
                        </div>
                        <ScrollArea className="flex-1">
                            {!selectedPageId ? (
                                <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-4 opacity-40">
                                    <ChevronRight className="w-12 h-12 rotate-180" />
                                    <p className="text-sm font-medium">Sélectionnez une page à gauche</p>
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
                                            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-right group ${currentSegmentId === seg.id ? 'bg-primary/10 border-primary ring-1 ring-primary/20' : 'bg-card hover:bg-muted/50 border-border/50 shadow-sm'}`}
                                        >
                                            <div className="flex flex-col items-start gap-1">
                                                <span className={`text-[10px] font-bold uppercase tracking-tighter ${currentSegmentId === seg.id ? 'text-primary' : 'text-muted-foreground'}`}>
                                                    Ligne {seg.order_index}
                                                </span>
                                                <div className="flex gap-1.5 flex-wrap">
                                                    {seg.status === 'validated' && (
                                                        <Badge variant="secondary" className="bg-success/10 text-success border-success/20 text-[9px] h-4">
                                                            Validé
                                                        </Badge>
                                                    )}
                                                    {seg.is_done_by_me && (
                                                        <div className="flex items-center gap-1 text-[9px] font-bold text-success">
                                                            <CheckCircle2 className="w-3 h-3" /> Fait
                                                        </div>
                                                    )}
                                                    {!seg.is_done_by_me && seg.transcription_count > 0 && (
                                                        <span className="text-[9px] font-bold text-amber-600">
                                                            {seg.transcription_count} prop.
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className={`p-2 rounded-full transition-transform group-hover:translate-x-1 ${currentSegmentId === seg.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                                <ChevronRight className="w-4 h-4" />
                                            </div>
                                        </button>
                                    ))}
                                    {segments.length === 0 && (
                                        <div className="py-20 text-center text-muted-foreground opacity-50 flex flex-col items-center gap-2">
                                            <List className="w-8 h-8 opacity-20" />
                                            <p className="text-xs">Aucune ligne trouvée pour cette page</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
