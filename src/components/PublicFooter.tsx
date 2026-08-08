'use client'

import Link from 'next/link'
import { useLanguage, type Language } from '@/lib/language-context'

const copy: Record<Language, { description: string; corpus: string; research: string }> = {
    fr: { description: 'Corpus collaboratif de manuscrits arabes.', corpus: 'Corpus', research: 'Méthodologie' },
    en: { description: 'Collaborative corpus of Arabic manuscripts.', corpus: 'Corpus', research: 'Methodology' },
    ar: { description: 'مجموعة تعاونية من المخطوطات العربية.', corpus: 'المجموعة', research: 'المنهجية' },
}

export function PublicFooter({ year }: { year: number }) {
    const { lang } = useLanguage()
    const c = copy[lang]

    return (
        <footer className="mt-16 w-full border-t border-border px-6 py-8 text-sm text-muted-foreground" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <p>© {year} Khatt-GPT · {c.description}</p>
                <nav className="flex gap-5">
                    <Link href="/corpus" className="hover:text-foreground">{c.corpus}</Link>
                    <Link href="/research" className="hover:text-foreground">{c.research}</Link>
                </nav>
            </div>
        </footer>
    )
}
