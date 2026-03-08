'use client'

import { X, ZoomIn } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'

type LightboxProps = {
    isOpen: boolean
    onClose: () => void
    image_url: string | null
    text: string | null
    title: string
}

export default function LineLightbox({ isOpen, onClose, image_url, text, title }: LightboxProps) {
    // Prevent scrolling when lightbox is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => { document.body.style.overflow = 'unset' }
    }, [isOpen])

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-background/80 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative z-10 w-full max-w-4xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-background/50 hover:bg-background transition-colors border border-border"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex-1 bg-muted/30 flex items-center justify-center p-6 min-h-[200px] md:min-h-[400px]">
                            {image_url ? (
                                <img
                                    src={image_url}
                                    alt="Manuscript Line"
                                    className="max-w-full max-h-full object-contain shadow-sm rounded-lg"
                                />
                            ) : (
                                <div className="text-muted-foreground flex flex-col items-center gap-2">
                                    <ZoomIn className="w-12 h-12 opacity-20" />
                                    <span>No image available</span>
                                </div>
                            )}
                        </div>

                        <div className="w-full md:w-[350px] p-8 flex flex-col gap-6 bg-card border-t md:border-t-0 md:border-l border-border overflow-y-auto">
                            <div className="space-y-1">
                                <span className="text-xs font-bold text-primary uppercase tracking-widest">{title}</span>
                                <h3 className="text-xl font-heading font-semibold">Transcription de la ligne</h3>
                            </div>

                            <div className="flex-1 flex flex-col justify-center">
                                <p className="font-arabic text-3xl md:text-4xl leading-relaxed text-right text-foreground p-4 bg-muted/20 rounded-xl border border-border/50" dir="rtl">
                                    {text || "En attente de transcription..."}
                                </p>
                            </div>

                            <div className="text-[11px] text-muted-foreground italic leading-relaxed pt-4 border-t border-border/50">
                                Cette transcription a été validée par la communauté Waraka. Elle fait partie du dataset open-source pour la recherche sur les manuscrits maghrébins.
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
