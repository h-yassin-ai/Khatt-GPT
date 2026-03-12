'use client'

import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { X, GripHorizontal } from 'lucide-react'

const ARABIC_LAYOUT = [
    ['ذ', 'ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'د'],
    ['ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك', 'ط'],
    ['ئ', 'ء', 'ؤ', 'ر', 'لا', 'ى', 'ة', 'و', 'ز', 'ظ'],
    ['َ', 'ً', 'ُ', 'ٌ', 'ِ', 'ٍ', 'ْ', 'ّ', 'ـ'] // Diacritics and tatweel
]

interface DraggableKeyboardProps {
    onKeyPress: (char: string) => void;
    onBackspace: () => void;
    onClose: () => void;
}

export default function DraggableKeyboard({ onKeyPress, onBackspace, onClose }: DraggableKeyboardProps) {
    return (
        <motion.div
            drag
            dragMomentum={false}
            dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 1000 }} // Soft constraints, better to have a ref container
            whileDrag={{ scale: 1.02, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-[100] bottom-10 right-10 w-fit max-w-[500px] bg-background/95 backdrop-blur-md border border-border shadow-2xl rounded-2xl p-4 flex flex-col gap-3 cursor-default selection:none"
            style={{ touchAction: 'none' }}
        >
            {/* Header / Drag Handle - restrict drag to this area if needed */}
            <div className="flex items-center justify-between mb-1 select-none">
                <div className="flex items-center gap-2 text-muted-foreground mr-12">
                    <GripHorizontal className="w-4 h-4 cursor-grab active:cursor-grabbing text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Arabic Keyboard</span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation() // Prevent dragging from close button
                        onClose()
                    }}
                    className="h-6 w-6 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive shrink-0"
                >
                    <X className="w-4 h-4" />
                </Button>
            </div>

            <div className="flex flex-col gap-2">
                {ARABIC_LAYOUT.map((row, rowIdx) => (
                    <div key={rowIdx} className="flex justify-center gap-1">
                        {row.map((char) => (
                            <Button
                                key={char}
                                variant="outline"
                                className="w-8 h-10 sm:w-10 sm:h-12 flex-shrink-0 text-lg font-arabic font-medium shadow-sm hover:bg-primary/5 hover:border-primary/50 transition-colors p-0 bg-card"
                                onClick={(e) => {
                                    e.preventDefault()
                                    onKeyPress(char)
                                }}
                                type="button"
                            >
                                {char}
                            </Button>
                        ))}
                        {/* Add Backspace on row 1 */}
                        {rowIdx === 1 && (
                            <Button
                                variant="destructive"
                                className="h-10 sm:h-12 px-2 shadow-sm text-xs font-bold"
                                onClick={(e) => {
                                    e.preventDefault()
                                    onBackspace()
                                }}
                                type="button"
                            >
                                DELETE
                            </Button>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex justify-center mt-1">
                <Button
                    variant="outline"
                    className="w-full h-10 sm:h-12 font-arabic text-lg shadow-sm bg-card hover:bg-muted/50 border-border/60 transition-colors"
                    onClick={(e) => {
                        e.preventDefault()
                        onKeyPress(' ')
                    }}
                    type="button"
                >
                    مسافة (SPACE)
                </Button>
            </div>

            <p className="text-[9px] text-muted-foreground text-center mt-1 opacity-50">
                You can drag this keyboard anywhere on your screen.
            </p>
        </motion.div>
    )
}
