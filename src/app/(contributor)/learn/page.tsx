'use client'

import Link from 'next/link'
import { BookOpen, Shuffle, GraduationCap, ArrowRight } from 'lucide-react'
import { useLanguage } from '@/lib/language-context'

export default function LearnHubPage() {
    const { lang, t } = useLanguage()
    return (
        <div className="flex flex-col gap-8 pb-12 max-w-5xl mx-auto w-full" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="flex flex-col text-center items-center justify-center pt-8 pb-4">
                <h1 className="text-4xl font-heading font-bold text-foreground flex items-center gap-3 mb-4">
                    <GraduationCap className="w-10 h-10 text-primary" /> {t('learn.hub_title')}
                </h1>
                <p className="text-muted-foreground max-w-2xl text-lg">
                    {t('learn.hub_desc')}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {/* Option 1: Browse Manuscripts */}
                <Link 
                    href="/browse"
                    className="group bg-card border border-border hover:border-primary/50 shadow-sm hover:shadow-md rounded-2xl p-8 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors text-primary shadow-sm">
                        <BookOpen className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-heading font-bold text-foreground mb-3">
                        {t('learn.browse_title')}
                    </h2>
                    <p className="text-muted-foreground mb-8">
                        {t('learn.browse_desc')}
                    </p>
                    <div className="mt-auto flex items-center text-primary font-bold gap-2 group-hover:gap-3 transition-all">
                        {t('learn.browse_cta')} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                    </div>
                </Link>

                {/* Option 2: Random Lines */}
                <Link 
                    href="/learn/random"
                    className="group bg-card border border-border hover:border-secondary/50 shadow-sm hover:shadow-md rounded-2xl p-8 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
                    <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mb-6 group-hover:bg-secondary group-hover:text-secondary-foreground transition-colors text-secondary shadow-sm">
                        <Shuffle className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-heading font-bold text-foreground mb-3">
                        {t('learn.random_title')}
                    </h2>
                    <p className="text-muted-foreground mb-8">
                        {t('learn.random_desc')}
                    </p>
                    <div className="mt-auto flex items-center text-secondary font-bold gap-2 group-hover:gap-3 transition-all">
                        {t('learn.random_cta')} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                    </div>
                </Link>
            </div>
        </div>
    )
}
