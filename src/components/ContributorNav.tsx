'use client'

import Link from 'next/link'
import { LayoutDashboard, PenLine, User, LogOut, BookOpen, ShieldCheck, GraduationCap, Languages } from 'lucide-react'
import { useLanguage } from '@/lib/language-context'

export function ContributorNav({ email, isAdmin }: { email: string; isAdmin: boolean }) {
    const { lang, setLang, t } = useLanguage()

    return (
        <div className="container flex h-16 items-center justify-between px-6 max-w-7xl mx-auto">
            <div className="flex items-center gap-6">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <span className="font-heading text-2xl font-bold text-primary">وراقة</span>
                    <span className="font-heading text-xl font-semibold hidden sm:inline-block">Waraka</span>
                </Link>
                <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
                    <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted text-foreground/80 hover:text-foreground">
                        <LayoutDashboard className="w-4 h-4" /> {t('nav.dashboard')}
                    </Link>
                    <Link href="/browse" className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted text-foreground/80 hover:text-foreground">
                        <BookOpen className="w-4 h-4" /> {t('nav.browse')}
                    </Link>
                    <Link href="/transcribe" className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted text-foreground/80 hover:text-foreground">
                        <PenLine className="w-4 h-4" /> {t('nav.transcribe')}
                    </Link>
                    <Link href="/learn" className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted text-foreground/80 hover:text-foreground">
                        <GraduationCap className="w-4 h-4" /> {t('nav.learn')}
                    </Link>
                    <Link href="/profile" className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted text-foreground/80 hover:text-foreground">
                        <User className="w-4 h-4" /> {t('nav.profile')}
                    </Link>
                    {isAdmin && (
                        <Link href="/admin" className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted text-primary hover:text-primary/80 font-bold">
                            <ShieldCheck className="w-4 h-4" /> {t('nav.admin')}
                        </Link>
                    )}
                </nav>
            </div>
            <div className="flex items-center gap-3">
                <div className="text-sm text-muted-foreground hidden sm:block">
                    {email}
                </div>
                <button
                    onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
                    className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    title={lang === 'fr' ? 'Switch to English' : 'Passer en français'}
                >
                    <Languages className="w-3.5 h-3.5" />
                    {t('nav.lang_toggle')}
                </button>
                <form action="/auth/signout" method="post">
                    <button type="submit" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm font-medium">
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline-block">{t('nav.signout')}</span>
                    </button>
                </form>
            </div>
        </div>
    )
}
