'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Languages, Library, Menu, Microscope, ScrollText, X } from 'lucide-react'
import { useLanguage, type Language } from '@/lib/language-context'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const copy: Record<Language, { corpus: string; research: string; propose: string; login: string; register: string }> = {
    fr: { corpus: 'Corpus', research: 'Méthodologie', propose: 'Proposer', login: 'Se connecter', register: 'Contribuer' },
    en: { corpus: 'Corpus', research: 'Methodology', propose: 'Suggest', login: 'Log in', register: 'Contribute' },
    ar: { corpus: 'المجموعة', research: 'المنهجية', propose: 'اقتراح', login: 'تسجيل الدخول', register: 'المساهمة' },
}

export function PublicHeader() {
    const { lang, setLang, t } = useLanguage()
    const [mobileOpen, setMobileOpen] = useState(false)
    const c = copy[lang]

    const links = (
        <>
            <Link href="/corpus" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-foreground/80 hover:bg-muted hover:text-foreground">
                <Library className="h-4 w-4" aria-hidden="true" /> {c.corpus}
            </Link>
            <Link href="/research" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-foreground/80 hover:bg-muted hover:text-foreground">
                <Microscope className="h-4 w-4" aria-hidden="true" /> {c.research}
            </Link>
            <Link href="/propose" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-foreground/80 hover:bg-muted hover:text-foreground">
                <ScrollText className="h-4 w-4" aria-hidden="true" /> {c.propose}
            </Link>
        </>
    )

    return (
        <div className="relative mx-auto grid h-16 w-full max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-2 px-4 sm:gap-4 sm:px-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <Link href="/" className="whitespace-nowrap font-heading text-xl font-black text-primary sm:text-2xl">Khatt-GPT</Link>
            <nav className="hidden items-center justify-center gap-1 md:flex" aria-label={t('nav.main')}>{links}</nav>
            <div className="flex items-center justify-end gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger aria-label={t('common.language')} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-bold uppercase text-muted-foreground hover:bg-muted">
                        <Languages className="h-4 w-4" aria-hidden="true" /> {lang}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setLang('fr')}>Français</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setLang('en')}>English</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setLang('ar')} className="font-arabic">العربية</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Link href="/auth/login" className="hidden h-9 items-center px-3 text-sm font-semibold hover:text-primary sm:inline-flex">{c.login}</Link>
                <Link href="/auth/register" className="public-register inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">{c.register}</Link>
                <button type="button" aria-label={t('common.menu')} aria-expanded={mobileOpen} onClick={() => setMobileOpen((open) => !open)} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border md:hidden">
                    {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </div>
            {mobileOpen ? <nav className="absolute left-0 right-0 top-16 z-50 flex flex-col border-b border-border bg-background p-4 shadow-lg md:hidden">{links}<Link href="/auth/login" onClick={() => setMobileOpen(false)} className="mt-2 rounded-md border border-border px-3 py-2 text-center text-sm font-semibold sm:hidden">{c.login}</Link><Link href="/auth/register" onClick={() => setMobileOpen(false)} className="public-mobile-register mt-2 rounded-md bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground">{c.register}</Link></nav> : null}
        </div>
    )
}
