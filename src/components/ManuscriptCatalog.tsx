'use client'

import Link from 'next/link'
import {
    ArrowRight,
    BookOpen,
    CheckCircle2,
    CircleAlert,
    FileText,
    GraduationCap,
    Layers3,
    Library,
    PenLine,
    Search,
} from 'lucide-react'
import { useLanguage, type Language } from '@/lib/language-context'
import type { ManuscriptCatalogItem, ManuscriptCatalogSummary } from '@/lib/manuscripts'

type CatalogCopy = {
    eyebrow: string
    title: string
    description: string
    searchPlaceholder: string
    searchAction: string
    manuscripts: string
    pages: string
    lines: string
    validated: string
    sourceUnknown: string
    progress: string
    validatedLines: string
    review: string
    conflicts: string
    record: string
    transcribe: string
    learn: string
    contribute: string
    referenceReady: string
    pdfReady: string
    emptyTitle: string
    emptyDescription: string
    unavailableTitle: string
    unavailableDescription: string
    clear: string
}

const copy: Record<Language, CatalogCopy> = {
    fr: {
        eyebrow: 'Catalogue scientifique',
        title: 'Corpus de manuscrits',
        description: 'Consultez les notices, l’état de validation et les ressources associées avant de lire ou transcrire un témoin.',
        searchPlaceholder: 'Titre, collection, institution…',
        searchAction: 'Rechercher',
        manuscripts: 'Manuscrits',
        pages: 'Pages numérisées',
        lines: 'Lignes segmentées',
        validated: 'Lignes validées',
        sourceUnknown: 'Institution non renseignée',
        progress: 'Validation du corpus',
        validatedLines: 'validées',
        review: 'à revoir',
        conflicts: 'conflits',
        record: 'Voir la notice',
        transcribe: 'Transcrire',
        learn: 'Étudier',
        contribute: 'Contribuer',
        referenceReady: 'Texte de référence',
        pdfReady: 'Fac-similé PDF',
        emptyTitle: 'Aucun manuscrit trouvé',
        emptyDescription: 'Modifiez les termes de recherche ou revenez au catalogue complet.',
        unavailableTitle: 'Catalogue temporairement indisponible',
        unavailableDescription: 'La connexion au dépôt de données n’a pas abouti. Les notices réapparaîtront automatiquement dès le rétablissement du service.',
        clear: 'Effacer la recherche',
    },
    en: {
        eyebrow: 'Scholarly catalogue',
        title: 'Manuscript corpus',
        description: 'Review catalogue records, validation status, and associated resources before reading or transcribing a witness.',
        searchPlaceholder: 'Title, collection, institution…',
        searchAction: 'Search',
        manuscripts: 'Manuscripts',
        pages: 'Digitized pages',
        lines: 'Segmented lines',
        validated: 'Validated lines',
        sourceUnknown: 'Holding institution not provided',
        progress: 'Corpus validation',
        validatedLines: 'validated',
        review: 'to review',
        conflicts: 'conflicts',
        record: 'View record',
        transcribe: 'Transcribe',
        learn: 'Study',
        contribute: 'Contribute',
        referenceReady: 'Reference text',
        pdfReady: 'PDF facsimile',
        emptyTitle: 'No manuscript found',
        emptyDescription: 'Change the search terms or return to the full catalogue.',
        unavailableTitle: 'Catalogue temporarily unavailable',
        unavailableDescription: 'The data repository could not be reached. Records will return automatically when the service is restored.',
        clear: 'Clear search',
    },
    ar: {
        eyebrow: 'الفهرس العلمي',
        title: 'مجموعة المخطوطات',
        description: 'اطّلع على البطاقة العلمية وحالة المراجعة والموارد المرفقة قبل القراءة أو النسخ.',
        searchPlaceholder: 'العنوان، المجموعة، المؤسسة…',
        searchAction: 'بحث',
        manuscripts: 'المخطوطات',
        pages: 'الصفحات الرقمية',
        lines: 'الأسطر المجزأة',
        validated: 'الأسطر المعتمدة',
        sourceUnknown: 'مؤسسة الحفظ غير مذكورة',
        progress: 'تقدّم المراجعة',
        validatedLines: 'معتمد',
        review: 'للمراجعة',
        conflicts: 'تعارضات',
        record: 'عرض البطاقة',
        transcribe: 'نسخ',
        learn: 'دراسة',
        contribute: 'مساهمة',
        referenceReady: 'نص مرجعي',
        pdfReady: 'نسخة PDF',
        emptyTitle: 'لم يُعثر على مخطوط',
        emptyDescription: 'غيّر كلمات البحث أو ارجع إلى الفهرس الكامل.',
        unavailableTitle: 'الفهرس غير متاح مؤقتاً',
        unavailableDescription: 'تعذّر الاتصال بمستودع البيانات. ستظهر البطاقات تلقائياً عند عودة الخدمة.',
        clear: 'مسح البحث',
    },
}

function SummaryItem({ icon: Icon, label, value }: { icon: typeof Library; label: string; value: number | null }) {
    return (
        <div className="min-w-0 border-l border-border pl-4 first:border-l-0 first:pl-0 rtl:border-l-0 rtl:border-r rtl:pl-0 rtl:pr-4 rtl:first:border-r-0 rtl:first:pr-0">
            <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate text-xs font-semibold uppercase tracking-wide">{label}</span>
            </div>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value === null ? '—' : value.toLocaleString()}</p>
        </div>
    )
}

export function ManuscriptCatalog({
    manuscripts,
    summary,
    query,
    detailBasePath,
    contributorActions,
    available,
}: {
    manuscripts: ManuscriptCatalogItem[]
    summary: ManuscriptCatalogSummary
    query: string
    detailBasePath: '/browse' | '/corpus'
    contributorActions: boolean
    available: boolean
}) {
    const { lang } = useLanguage()
    const c = copy[lang]

    return (
        <div className="w-full pb-12" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <header className="border-b border-border pb-7 pt-2">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{c.eyebrow}</p>
                <div className="mt-3 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                    <div className="max-w-3xl">
                        <h1 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">{c.title}</h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{c.description}</p>
                    </div>
                    <form className="flex w-full max-w-md items-center gap-2" role="search">
                        <label htmlFor="catalog-query" className="sr-only">{c.searchPlaceholder}</label>
                        <div className="relative min-w-0 flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3" aria-hidden="true" />
                            <input
                                id="catalog-query"
                                type="search"
                                name="query"
                                defaultValue={query}
                                placeholder={c.searchPlaceholder}
                                className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 rtl:pl-3 rtl:pr-9"
                            />
                        </div>
                        <button type="submit" className="h-10 rounded-md bg-secondary px-4 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary/90">
                            {c.searchAction}
                        </button>
                    </form>
                </div>

                <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
                    <SummaryItem icon={Library} label={c.manuscripts} value={available ? summary.manuscripts : null} />
                    <SummaryItem icon={BookOpen} label={c.pages} value={available ? summary.pages : null} />
                    <SummaryItem icon={Layers3} label={c.lines} value={available ? summary.segments : null} />
                    <SummaryItem icon={CheckCircle2} label={c.validated} value={available ? summary.validated : null} />
                </div>
            </header>

            {available && manuscripts.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 pt-7 lg:grid-cols-2">
                    {manuscripts.map((manuscript) => (
                        <article key={manuscript.id} className="grid min-h-64 grid-cols-[116px_1fr] overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-colors hover:border-primary/40 sm:grid-cols-[160px_1fr] [content-visibility:auto]">
                            <div className="relative min-h-full overflow-hidden border-r border-border bg-muted rtl:border-l rtl:border-r-0">
                                {manuscript.coverImageUrl ? (
                                    <img
                                        src={manuscript.coverImageUrl}
                                        alt=""
                                        loading="lazy"
                                        decoding="async"
                                        className="h-full w-full object-cover grayscale-[20%] transition duration-500 hover:grayscale-0"
                                    />
                                ) : (
                                    <div className="flex h-full min-h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
                                        <BookOpen className="h-9 w-9 opacity-40" aria-hidden="true" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">KHATT-GPT</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex min-w-0 flex-col p-4 sm:p-5">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                        <span>{manuscript.pageCount} {c.pages.toLowerCase()}</span>
                                        <span aria-hidden="true">·</span>
                                        <span>{manuscript.totalSegments} {c.lines.toLowerCase()}</span>
                                    </div>
                                    <h2 className="mt-2 line-clamp-2 font-heading text-xl font-semibold leading-tight text-foreground sm:text-2xl">
                                        {manuscript.title}
                                    </h2>
                                    <p className="mt-1 truncate text-sm text-muted-foreground">{manuscript.source || c.sourceUnknown}</p>
                                    {manuscript.description ? (
                                        <p className="mt-3 line-clamp-2 text-sm leading-5 text-muted-foreground">{manuscript.description}</p>
                                    ) : null}
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    {manuscript.hasReferenceText ? (
                                        <span className="inline-flex items-center gap-1 rounded border border-secondary/20 bg-secondary/5 px-2 py-1 text-[11px] font-semibold text-secondary">
                                            <FileText className="h-3 w-3" aria-hidden="true" /> {c.referenceReady}
                                        </span>
                                    ) : null}
                                    {manuscript.hasPdf ? (
                                        <span className="inline-flex items-center gap-1 rounded border border-primary/20 bg-primary/5 px-2 py-1 text-[11px] font-semibold text-primary">
                                            <BookOpen className="h-3 w-3" aria-hidden="true" /> {c.pdfReady}
                                        </span>
                                    ) : null}
                                    {manuscript.conflictSegments > 0 ? (
                                        <span className="inline-flex items-center gap-1 rounded border border-destructive/20 bg-destructive/5 px-2 py-1 text-[11px] font-semibold text-destructive">
                                            <CircleAlert className="h-3 w-3" aria-hidden="true" /> {manuscript.conflictSegments} {c.conflicts}
                                        </span>
                                    ) : null}
                                </div>

                                <div className="mt-auto pt-5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-muted-foreground">{c.progress}</span>
                                        <span className="font-semibold tabular-nums text-foreground">{manuscript.progress}%</span>
                                    </div>
                                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                                        <div className="h-full rounded-full bg-secondary" style={{ width: `${manuscript.progress}%` }} />
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                                        <span>{manuscript.validatedSegments} {c.validatedLines}</span>
                                        <span>{manuscript.reviewSegments} {c.review}</span>
                                    </div>

                                    <div className="mt-4 flex flex-wrap items-center gap-2">
                                        <Link href={`${detailBasePath}/${manuscript.id}`} className="inline-flex h-9 items-center gap-2 rounded-md bg-secondary px-3 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90">
                                            {c.record} <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                                        </Link>
                                        {contributorActions ? (
                                            <>
                                                <Link href={`/transcribe?manuscriptId=${manuscript.id}`} className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold hover:bg-muted">
                                                    <PenLine className="h-4 w-4" aria-hidden="true" /> {c.transcribe}
                                                </Link>
                                                <Link href={`/learn/random?manuscriptId=${manuscript.id}`} className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold hover:bg-muted">
                                                    <GraduationCap className="h-4 w-4" aria-hidden="true" /> {c.learn}
                                                </Link>
                                            </>
                                        ) : (
                                            <Link href="/auth/register" className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold hover:bg-muted">
                                                <PenLine className="h-4 w-4" aria-hidden="true" /> {c.contribute}
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                <div className="flex min-h-72 flex-col items-center justify-center border-b border-border py-16 text-center">
                    <Library className="h-10 w-10 text-muted-foreground/50" aria-hidden="true" />
                    <h2 className="mt-4 font-heading text-2xl font-semibold">{available ? c.emptyTitle : c.unavailableTitle}</h2>
                    <p className="mt-2 max-w-md text-sm text-muted-foreground">{available ? c.emptyDescription : c.unavailableDescription}</p>
                    {available && query ? <Link href={detailBasePath} className="mt-5 text-sm font-semibold text-primary hover:underline">{c.clear}</Link> : null}
                </div>
            )}
        </div>
    )
}
