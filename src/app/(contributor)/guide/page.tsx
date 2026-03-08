'use client'

import { useLanguage } from '@/lib/language-context'
import { Feather, Info, AlertCircle, CheckCircle, ArrowRight, BookOpen, Layers, Type } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'

export default function CalligraphyGuidePage() {
    const { t } = useLanguage()

    const styles = [
        {
            id: 'mabsut',
            title: 'Mabsut',
            description: t('guide.styles.mabsut'),
            image: '/images/guide/mabsut.png',
            color: 'bg-primary/10'
        },
        {
            id: 'mujawhar',
            title: 'Mujawhar',
            description: t('guide.styles.mujawhar'),
            image: '/images/guide/mujawhar.png',
            color: 'bg-secondary/10'
        },
        {
            id: 'thuluth',
            title: 'Thuluth Maghribi',
            description: t('guide.styles.thuluth'),
            image: '/images/guide/thuluth.png',
            color: 'bg-blue-500/10'
        }
    ]

    return (
        <div className="flex flex-col gap-12 pb-20 animate-in fade-in duration-500">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-card border border-border p-8 lg:p-12">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                <div className="relative z-10 max-w-3xl">
                    <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold mb-6 uppercase tracking-wider">
                        <Feather className="w-4 h-4" /> Apprendre
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-heading font-bold text-foreground mb-6 leading-tight">
                        {t('guide.title')}
                    </h1>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        {t('guide.desc')}
                    </p>
                </div>
            </div>

            {/* The Dotting System */}
            <div className="space-y-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                        <Info className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-heading font-bold text-foreground">{t('guide.dots.title')}</h2>
                        <p className="text-muted-foreground">{t('guide.dots.desc')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Faa */}
                    <Card className="border-border/50 bg-card/30 backdrop-blur-sm group hover:border-primary/50 transition-all">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex justify-between items-center">
                                <div className="text-4xl font-arabic text-primary">ڢ</div>
                                <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/20">FAA</div>
                            </div>
                            <h3 className="text-lg font-bold text-foreground">{t('guide.fa.title')}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed italic">
                                "{t('guide.fa.desc')}"
                            </p>
                            <div className="pt-2 flex items-center gap-2 text-xs text-amber-600 font-bold bg-amber-50 rounded-lg p-2">
                                <AlertCircle className="w-3.5 h-3.5" /> Différence majeure
                            </div>
                        </CardContent>
                    </Card>

                    {/* Qaf */}
                    <Card className="border-border/50 bg-card/30 backdrop-blur-sm group hover:border-primary/50 transition-all">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex justify-between items-center">
                                <div className="text-4xl font-arabic text-primary">ڧ</div>
                                <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/20">QAF</div>
                            </div>
                            <h3 className="text-lg font-bold text-foreground">{t('guide.qaf.title')}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed italic">
                                "{t('guide.qaf.desc')}"
                            </p>
                        </CardContent>
                    </Card>

                    {/* Nun */}
                    <Card className="border-border/50 bg-card/30 backdrop-blur-sm group hover:border-primary/50 transition-all">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex justify-between items-center">
                                <div className="text-4xl font-arabic text-primary">ن</div>
                                <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/20">NUN</div>
                            </div>
                            <h3 className="text-lg font-bold text-foreground">{t('guide.nun.title')}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed italic">
                                "{t('guide.nun.desc')}"
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Styles Section */}
            <div className="space-y-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary">
                        <Layers className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-heading font-bold text-foreground">{t('guide.styles.title')}</h2>
                        <p className="text-muted-foreground">Découvrez les trois styles principaux que vous rencontrerez.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {styles.map((style) => (
                        <motion.div
                            key={style.id}
                            whileHover={{ y: -5 }}
                            className="bg-card border border-border shadow-sm rounded-2xl overflow-hidden flex flex-col h-full group"
                        >
                            <div className="aspect-[16/10] relative overflow-hidden bg-muted">
                                <img
                                    src={style.image}
                                    alt={style.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                            </div>
                            <div className="p-6 flex flex-col gap-4 flex-1">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-6 ${style.id === 'mabsut' ? 'bg-primary' : style.id === 'mujawhar' ? 'bg-secondary' : 'bg-blue-500'} rounded-full`} />
                                    <h3 className="text-xl font-heading font-bold text-foreground">{style.title}</h3>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed flex-1 italic">
                                    {style.description}
                                </p>
                                <div className="pt-4 border-t border-border/40 flex justify-end">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1">
                                        Style {style.id} <ArrowRight className="w-3 h-3" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Final Tips Card */}
            <div className="bg-primary/5 rounded-3xl border border-primary/20 p-8 lg:p-12 mt-4 text-center">
                <Type className="w-12 h-12 text-primary mx-auto mb-6 opacity-40" />
                <h2 className="text-3xl font-heading font-bold text-foreground mb-4">Besoin d'aide supplémentaire ?</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
                    N'oubliez pas d'utiliser le panneau "Ouvrir le panneau" sur la page de transcription pour consulter le fac-similé complet ou le texte imprimé correspondant.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                    <div className="bg-card border border-border px-6 py-3 rounded-full flex items-center gap-2 text-sm font-bold shadow-sm">
                        <CheckCircle className="w-4 h-4 text-success" /> Précision avant tout
                    </div>
                </div>
            </div>
        </div>
    )
}
