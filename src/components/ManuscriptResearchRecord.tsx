'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
    ArrowLeft,
    BookOpen,
    Check,
    CheckCircle2,
    Clipboard,
    Database,
    Download,
    ExternalLink,
    FileText,
    GraduationCap,
    Library,
    PenLine,
    ShieldCheck,
    TriangleAlert,
    X,
} from 'lucide-react'
import { useLanguage, type Language } from '@/lib/language-context'
import type { ManuscriptResearchRecord as ResearchRecord } from '@/lib/manuscripts'

type RecordCopy = {
    back: string
    scholarlyRecord: string
    workingCorpus: string
    source: string
    identifier: string
    added: string
    pages: string
    lines: string
    validated: string
    review: string
    conflicts: string
    validation: string
    transcribe: string
    study: string
    createAccount: string
    openPdf: string
    qualityTitle: string
    qualityDescription: string
    sourceCheck: string
    descriptionCheck: string
    scansCheck: string
    referenceCheck: string
    validationCheck: string
    complete: string
    incomplete: string
    resourcesTitle: string
    referenceText: string
    facsimile: string
    available: string
    unavailable: string
    pagesTitle: string
    pagesDescription: string
    page: string
    validatedShort: string
    issueShort: string
    protocolTitle: string
    protocolDescription: string
    segmented: string
    segmentedDesc: string
    compared: string
    comparedDesc: string
    consensus: string
    consensusDesc: string
    expert: string
    expertDesc: string
    citationTitle: string
    citationDescription: string
    citationLabel: string
    bibtexLabel: string
    copy: string
    copied: string
    downloadMetadata: string
    dataNotice: string
}

const copy: Record<Language, RecordCopy> = {
    fr: {
        back: 'Retour au corpus', scholarlyRecord: 'Notice scientifique', workingCorpus: 'Corpus de travail évolutif',
        source: 'Institution / collection', identifier: 'Identifiant de notice', added: 'Mise en ligne', pages: 'Pages', lines: 'Lignes',
        validated: 'Validées', review: 'À revoir', conflicts: 'Conflits', validation: 'Validation', transcribe: 'Transcrire ce manuscrit',
        study: 'Étudier les lignes', createAccount: 'Créer un compte pour contribuer', openPdf: 'Ouvrir le fac-similé',
        qualityTitle: 'Complétude scientifique', qualityDescription: 'Indicateurs nécessaires pour documenter et réutiliser le corpus dans un cadre de recherche.',
        sourceCheck: 'Institution ou collection renseignée', descriptionCheck: 'Contexte scientifique documenté', scansCheck: 'Scans de pages disponibles',
        referenceCheck: 'Texte publié de référence associé', validationCheck: 'Premières données validées', complete: 'Renseigné', incomplete: 'À compléter',
        resourcesTitle: 'Ressources associées', referenceText: 'Texte de référence consultable pendant la transcription', facsimile: 'Fac-similé intégral en PDF',
        available: 'Disponible', unavailable: 'Non disponible', pagesTitle: 'Aperçu du témoin', pagesDescription: 'Pages classées selon l’ordre du manuscrit et état de leurs lignes.',
        page: 'Page', validatedShort: 'validées', issueShort: 'signalements', protocolTitle: 'Traçabilité de la transcription',
        protocolDescription: 'Chaque ligne suit un parcours vérifiable avant d’intégrer le corpus validé.', segmented: 'Segmentation',
        segmentedDesc: 'La ligne est reliée à sa page et à sa position.', compared: 'Transcriptions parallèles',
        comparedDesc: 'Plusieurs propositions indépendantes sont conservées.', consensus: 'Consensus', consensusDesc: 'Les rapprochements sont calculés sans effacer les variantes.',
        expert: 'Validation experte', expertDesc: 'Les conflits et signalements restent visibles pour révision.', citationTitle: 'Citer et réutiliser',
        citationDescription: 'La citation précise le témoin, la source, l’identifiant et l’état du corpus.', citationLabel: 'Citation recommandée',
        bibtexLabel: 'BibTeX', copy: 'Copier', copied: 'Copié', downloadMetadata: 'Télécharger les métadonnées JSON',
        dataNotice: 'Les transcriptions non validées doivent être citées comme données de travail.',
    },
    en: {
        back: 'Back to corpus', scholarlyRecord: 'Scholarly record', workingCorpus: 'Evolving working corpus',
        source: 'Holding institution / collection', identifier: 'Record identifier', added: 'Published', pages: 'Pages', lines: 'Lines',
        validated: 'Validated', review: 'To review', conflicts: 'Conflicts', validation: 'Validation', transcribe: 'Transcribe this manuscript',
        study: 'Study validated lines', createAccount: 'Create an account to contribute', openPdf: 'Open facsimile',
        qualityTitle: 'Scholarly completeness', qualityDescription: 'Indicators required to document and reuse the corpus in a research context.',
        sourceCheck: 'Holding institution or collection documented', descriptionCheck: 'Scholarly context documented', scansCheck: 'Page scans available',
        referenceCheck: 'Published reference text attached', validationCheck: 'Initial validated data available', complete: 'Complete', incomplete: 'To complete',
        resourcesTitle: 'Associated resources', referenceText: 'Reference text available during transcription', facsimile: 'Complete PDF facsimile',
        available: 'Available', unavailable: 'Unavailable', pagesTitle: 'Witness preview', pagesDescription: 'Pages ordered according to the manuscript with line-level status.',
        page: 'Page', validatedShort: 'validated', issueShort: 'flags', protocolTitle: 'Transcription traceability',
        protocolDescription: 'Each line follows an auditable path before entering the validated corpus.', segmented: 'Segmentation',
        segmentedDesc: 'The line remains linked to its page and position.', compared: 'Parallel transcriptions',
        comparedDesc: 'Independent proposals are retained.', consensus: 'Consensus', consensusDesc: 'Similarity is assessed without erasing variants.',
        expert: 'Expert validation', expertDesc: 'Conflicts and segmentation flags remain available for review.', citationTitle: 'Cite and reuse',
        citationDescription: 'The citation identifies the witness, source, record, and corpus state.', citationLabel: 'Recommended citation',
        bibtexLabel: 'BibTeX', copy: 'Copy', copied: 'Copied', downloadMetadata: 'Download JSON metadata',
        dataNotice: 'Unvalidated transcriptions should be cited as working data.',
    },
    ar: {
        back: 'العودة إلى المجموعة', scholarlyRecord: 'البطاقة العلمية', workingCorpus: 'مجموعة عمل قابلة للتحديث',
        source: 'مؤسسة الحفظ / المجموعة', identifier: 'معرّف البطاقة', added: 'تاريخ النشر', pages: 'الصفحات', lines: 'الأسطر',
        validated: 'المعتمدة', review: 'للمراجعة', conflicts: 'التعارضات', validation: 'نسبة الاعتماد', transcribe: 'نسخ هذا المخطوط',
        study: 'دراسة الأسطر', createAccount: 'إنشاء حساب للمساهمة', openPdf: 'فتح النسخة المصورة',
        qualityTitle: 'اكتمال الوصف العلمي', qualityDescription: 'مؤشرات ضرورية لتوثيق المجموعة وإعادة استخدامها في البحث العلمي.',
        sourceCheck: 'توثيق مؤسسة الحفظ أو المجموعة', descriptionCheck: 'توثيق السياق العلمي', scansCheck: 'توفر صور الصفحات',
        referenceCheck: 'إرفاق النص المنشور المرجعي', validationCheck: 'توفر بيانات معتمدة', complete: 'مكتمل', incomplete: 'يحتاج إلى استكمال',
        resourcesTitle: 'الموارد المرتبطة', referenceText: 'نص مرجعي متاح أثناء النسخ', facsimile: 'نسخة مصورة كاملة بصيغة PDF',
        available: 'متاح', unavailable: 'غير متاح', pagesTitle: 'معاينة المخطوط', pagesDescription: 'صفحات مرتبة بحسب المخطوط مع حالة الأسطر.',
        page: 'الصفحة', validatedShort: 'معتمد', issueShort: 'بلاغات', protocolTitle: 'تتبّع عملية النسخ',
        protocolDescription: 'يمر كل سطر بمسار قابل للتحقق قبل إدراجه في المجموعة المعتمدة.', segmented: 'التجزئة',
        segmentedDesc: 'يبقى السطر مرتبطاً بصفحته وموضعه.', compared: 'نسخ متوازية', comparedDesc: 'تُحفظ المقترحات المستقلة للمقارنة.',
        consensus: 'التوافق', consensusDesc: 'تُقاس أوجه التشابه مع حفظ الاختلافات.', expert: 'المراجعة العلمية',
        expertDesc: 'تبقى التعارضات وبلاغات التجزئة ظاهرة للمراجعة.', citationTitle: 'الاقتباس وإعادة الاستخدام',
        citationDescription: 'يحدّد الاقتباس المخطوط والمصدر والمعرّف وحالة المجموعة.', citationLabel: 'صيغة الاقتباس المقترحة',
        bibtexLabel: 'BibTeX', copy: 'نسخ', copied: 'تم النسخ', downloadMetadata: 'تنزيل البيانات الوصفية JSON',
        dataNotice: 'يجب وصف النصوص غير المعتمدة بأنها بيانات عمل عند الاقتباس.',
    },
}

function formatDate(value: string, lang: Language) {
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar' : lang === 'en' ? 'en-GB' : 'fr-FR', {
        year: 'numeric', month: 'long', day: 'numeric',
    }).format(new Date(value))
}

function CopyButton({ value, label, copiedLabel }: { value: string; label: string; copiedLabel: string }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        await navigator.clipboard.writeText(value)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1800)
    }

    return (
        <button type="button" onClick={handleCopy} className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold hover:bg-muted">
            {copied ? <Check className="h-4 w-4 text-green-700" aria-hidden="true" /> : <Clipboard className="h-4 w-4" aria-hidden="true" />}
            {copied ? copiedLabel : label}
        </button>
    )
}

export function ManuscriptResearchRecord({
    record,
    backHref,
    contributorActions,
}: {
    record: ResearchRecord
    backHref: '/browse' | '/corpus'
    contributorActions: boolean
}) {
    const { lang } = useLanguage()
    const c = copy[lang]
    const identifier = `KHATT-${record.id.slice(0, 8).toUpperCase()}`
    const publishedYear = new Date(record.createdAt).getFullYear()
    const source = record.source || c.incomplete
    const citation = `Khatt-GPT. « ${record.title} ». ${source}. ${identifier}, corpus collaboratif de transcription de manuscrits arabes, ${record.validatedSegments}/${record.totalSegments} lignes validées.`
    const bibtex = `@misc{${identifier.toLowerCase()},\n  author = {{Khatt-GPT}},\n  title = {${record.title.replaceAll('{', '').replaceAll('}', '')}},\n  year = {${publishedYear}},\n  howpublished = {Collaborative Arabic manuscript transcription corpus},\n  note = {${source}; ${record.validatedSegments}/${record.totalSegments} validated lines; record ${identifier}}\n}`
    const checks = [
        { label: c.sourceCheck, value: record.qualityChecks.source },
        { label: c.descriptionCheck, value: record.qualityChecks.description },
        { label: c.scansCheck, value: record.qualityChecks.pageImages },
        { label: c.referenceCheck, value: record.qualityChecks.referenceText },
        { label: c.validationCheck, value: record.qualityChecks.validatedData },
    ]

    const downloadMetadata = () => {
        const payload = {
            identifier,
            title: record.title,
            holdingInstitutionOrCollection: record.source,
            description: record.description,
            createdAt: record.createdAt,
            pages: record.pageCount,
            segmentedLines: record.totalSegments,
            validatedLines: record.validatedSegments,
            reviewLines: record.reviewSegments,
            conflicts: record.conflictSegments,
            qualityScore: record.qualityScore,
            resources: { pdf: record.pdfUrl, referenceText: record.referenceTextUrl },
            citation,
        }
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = `${identifier.toLowerCase()}-metadata.json`
        anchor.click()
        URL.revokeObjectURL(url)
    }

    const downloadTeiXml = () => {
        const teiXml = `<?xml version="1.0" encoding="UTF-8"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0">
  <teiHeader>
    <fileDesc>
      <titleStmt>
        <title>${record.title}</title>
        <author>${record.author || 'Anonyme'}</author>
        <respStmt>
          <resp>HTR Transcription & Collaborative Consensus</resp>
          <name>Khatt-GPT</name>
        </respStmt>
      </titleStmt>
      <publicationStmt>
        <distributor>Khatt-GPT Open Research Corpus</distributor>
        <idno type="KHATT">${identifier}</idno>
        <availability>
          <licence target="https://creativecommons.org/licenses/by/4.0/">${record.license || 'CC-BY 4.0 / Open Access'}</licence>
        </availability>
        <date when="${publishedYear}">${publishedYear}</date>
      </publicationStmt>
      <sourceDesc>
        <msDesc>
          <msIdentifier>
            <institution>${record.source || 'Non renseignée'}</institution>
            <idno>${record.shelfmark || identifier}</idno>
          </msIdentifier>
          <msContents>
            <summary>${(record.description || '').replace(/[<>&]/g, '')}</summary>
          </msContents>
          <physDesc>
            <objectDesc form="codex">
              <supportDesc>
                <extent>
                  <measure unit="page" quantity="${record.pageCount}">${record.pageCount} pages numérisées</measure>
                  <measure unit="line" quantity="${record.totalSegments}">${record.totalSegments} lignes segmentées</measure>
                </extent>
              </supportDesc>
            </objectDesc>
            <scriptDesc>
              <scriptNote script="${record.scriptType || 'Maghrebi'}">${record.scriptType || 'Maghrébin'}</scriptNote>
            </scriptDesc>
          </physDesc>
          <history>
            <origin>
              <origDate>${record.century || 'Non daté'}</origDate>
            </origin>
          </history>
        </msDesc>
      </sourceDesc>
    </fileDesc>
  </teiHeader>
  <text>
    <body>
      <p><!-- Khatt-GPT Corpus: ${record.validatedSegments} / ${record.totalSegments} validated segments --></p>
    </body>
  </text>
</TEI>`
        const blob = new Blob([teiXml], { type: 'application/xml' })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = `${identifier.toLowerCase()}-tei.xml`
        anchor.click()
        URL.revokeObjectURL(url)
    }

    return (
        <article className="w-full pb-14" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <header className="border-b border-border pb-8">
                <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" /> {c.back}
                </Link>
                <div className="mt-6 grid gap-8 lg:grid-cols-[260px_1fr]">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-border bg-muted">
                        {record.coverImageUrl ? (
                            <img src={record.coverImageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
                                <BookOpen className="h-12 w-12 opacity-40" aria-hidden="true" />
                                <span className="text-xs font-bold uppercase tracking-wider">KHATT-GPT</span>
                            </div>
                        )}
                    </div>
                    <div className="min-w-0 self-center">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded border border-secondary/20 bg-secondary/5 px-2 py-1 text-xs font-bold uppercase tracking-wide text-secondary">{c.scholarlyRecord}</span>
                            <span className="rounded border border-border px-2 py-1 text-xs font-semibold text-muted-foreground">{c.workingCorpus}</span>
                        </div>
                        <h1 className="mt-4 max-w-4xl font-heading text-3xl font-semibold leading-tight text-foreground sm:text-4xl">{record.title}</h1>
                        <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">{record.description || c.incomplete}</p>

                        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                            <div><dt className="font-semibold text-muted-foreground">{c.source}</dt><dd className="mt-1 text-foreground">{source}</dd></div>
                            <div><dt className="font-semibold text-muted-foreground">{c.identifier}</dt><dd className="mt-1 font-mono text-foreground">{identifier}</dd></div>
                            <div><dt className="font-semibold text-muted-foreground">{c.added}</dt><dd className="mt-1 text-foreground">{formatDate(record.createdAt, lang)}</dd></div>
                            {record.shelfmark && <div><dt className="font-semibold text-muted-foreground">{lang === 'ar' ? 'رقم الحفظ (Cote)' : lang === 'fr' ? 'Cote d’inventaire' : 'Shelfmark'}</dt><dd className="mt-1 font-mono text-primary font-medium">{record.shelfmark}</dd></div>}
                            {record.author && <div><dt className="font-semibold text-muted-foreground">{lang === 'ar' ? 'المؤلف / الناسخ' : lang === 'fr' ? 'Auteur / Copiste' : 'Author / Scribe'}</dt><dd className="mt-1 text-foreground">{record.author}</dd></div>}
                            {record.scriptType && <div><dt className="font-semibold text-muted-foreground">{lang === 'ar' ? 'نوع الخط' : lang === 'fr' ? 'Graphie maghrébine' : 'Script style'}</dt><dd className="mt-1 text-foreground font-mono">{record.scriptType}</dd></div>}
                            {record.century && <div><dt className="font-semibold text-muted-foreground">{lang === 'ar' ? 'الحقبة / التاريخ' : lang === 'fr' ? 'Datation estimée' : 'Period / Century'}</dt><dd className="mt-1 text-foreground">{record.century}</dd></div>}
                            <div><dt className="font-semibold text-muted-foreground">{lang === 'ar' ? 'الترخيص الأكاديمي' : lang === 'fr' ? 'Licence de diffusion' : 'Scholarly License'}</dt><dd className="mt-1 text-xs text-muted-foreground">{record.license || 'Open Access / CC-BY 4.0'}</dd></div>
                        </dl>

                        <div className="mt-7 flex flex-wrap gap-2">
                            {contributorActions ? (
                                <>
                                    <Link href={`/transcribe?manuscriptId=${record.id}`} className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                                        <PenLine className="h-4 w-4" aria-hidden="true" /> {c.transcribe}
                                    </Link>
                                    <Link href={`/learn/random?manuscriptId=${record.id}`} className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-4 text-sm font-semibold hover:bg-muted">
                                        <GraduationCap className="h-4 w-4" aria-hidden="true" /> {c.study}
                                    </Link>
                                </>
                            ) : (
                                <Link href="/auth/register" className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                                    <PenLine className="h-4 w-4" aria-hidden="true" /> {c.createAccount}
                                </Link>
                            )}
                            {record.pdfUrl ? (
                                <a href={record.pdfUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-4 text-sm font-semibold hover:bg-muted">
                                    <ExternalLink className="h-4 w-4" aria-hidden="true" /> {c.openPdf}
                                </a>
                            ) : null}
                        </div>
                    </div>
                </div>
            </header>

            <section className="grid grid-cols-2 gap-x-5 gap-y-6 border-b border-border py-7 sm:grid-cols-5" aria-label={c.validation}>
                {[
                    { label: c.pages, value: record.pageCount, icon: BookOpen },
                    { label: c.lines, value: record.totalSegments, icon: Database },
                    { label: c.validated, value: record.validatedSegments, icon: CheckCircle2 },
                    { label: c.review, value: record.reviewSegments, icon: TriangleAlert },
                    { label: c.validation, value: `${record.progress}%`, icon: ShieldCheck },
                ].map((item) => (
                    <div key={item.label} className="min-w-0">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                            <item.icon className="h-4 w-4" aria-hidden="true" /> <span className="truncate">{item.label}</span>
                        </div>
                        <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{typeof item.value === 'number' ? item.value.toLocaleString() : item.value}</p>
                    </div>
                ))}
            </section>

            <section className="grid gap-10 border-b border-border py-10 lg:grid-cols-[1.15fr_0.85fr]">
                <div>
                    <div className="flex items-end justify-between gap-4">
                        <div>
                            <h2 className="font-heading text-2xl font-semibold">{c.qualityTitle}</h2>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{c.qualityDescription}</p>
                        </div>
                        <span className="text-3xl font-semibold tabular-nums text-secondary">{record.qualityScore}%</span>
                    </div>
                    <div className="mt-6 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-secondary" style={{ width: `${record.qualityScore}%` }} /></div>
                    <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                        {checks.map((check) => (
                            <li key={check.label} className="flex items-start gap-3 text-sm">
                                {check.value ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-700" aria-hidden="true" /> : <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
                                <span><span className="text-foreground">{check.label}</span><span className="ml-2 text-xs text-muted-foreground rtl:ml-0 rtl:mr-2">{check.value ? c.complete : c.incomplete}</span></span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="border-l border-border pl-8 rtl:border-l-0 rtl:border-r rtl:pl-0 rtl:pr-8">
                    <h2 className="font-heading text-2xl font-semibold">{c.resourcesTitle}</h2>
                    <div className="mt-5 space-y-5">
                        <div className="flex items-start gap-3"><FileText className="mt-0.5 h-5 w-5 text-secondary" aria-hidden="true" /><div><p className="font-semibold">{c.referenceText}</p><p className="mt-1 text-sm text-muted-foreground">{record.referenceTextUrl ? c.available : c.unavailable}</p></div></div>
                        <div className="flex items-start gap-3"><BookOpen className="mt-0.5 h-5 w-5 text-primary" aria-hidden="true" /><div><p className="font-semibold">{c.facsimile}</p><p className="mt-1 text-sm text-muted-foreground">{record.pdfUrl ? c.available : c.unavailable}</p></div></div>
                    </div>
                </div>
            </section>

            <section className="border-b border-border py-10">
                <h2 className="font-heading text-2xl font-semibold">{c.pagesTitle}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{c.pagesDescription}</p>
                {record.pages.length > 0 ? (
                    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                        {record.pages.slice(0, 12).map((page) => (
                            <div key={page.id} className="overflow-hidden rounded-lg border border-border bg-card">
                                <div className="aspect-[3/4] bg-muted">
                                    {page.imageUrl ? <img src={page.imageUrl} alt={`${c.page} ${page.orderIndex}`} loading="lazy" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Library className="h-7 w-7 text-muted-foreground/40" aria-hidden="true" /></div>}
                                </div>
                                <div className="border-t border-border p-3 text-xs">
                                    <p className="font-semibold">{c.page} {page.orderIndex}</p>
                                    <p className="mt-1 text-muted-foreground">{page.validatedCount}/{page.lineCount} {c.validatedShort}</p>
                                    {page.issueCount > 0 ? <p className="mt-1 font-semibold text-destructive">{page.issueCount} {c.issueShort}</p> : null}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : <p className="mt-6 text-sm text-muted-foreground">{c.unavailable}</p>}
            </section>

            <section className="border-b border-border py-10">
                <h2 className="font-heading text-2xl font-semibold">{c.protocolTitle}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{c.protocolDescription}</p>
                <ol className="mt-7 grid gap-6 md:grid-cols-4">
                    {[
                        { title: c.segmented, description: c.segmentedDesc },
                        { title: c.compared, description: c.comparedDesc },
                        { title: c.consensus, description: c.consensusDesc },
                        { title: c.expert, description: c.expertDesc },
                    ].map((step, index) => (
                        <li key={step.title} className="border-t-2 border-secondary pt-4">
                            <span className="font-mono text-xs font-bold text-primary">0{index + 1}</span>
                            <h3 className="mt-2 font-semibold">{step.title}</h3>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
                        </li>
                    ))}
                </ol>
            </section>

            <section className="py-10">
                <div className="max-w-4xl">
                    <h2 className="font-heading text-2xl font-semibold">{c.citationTitle}</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{c.citationDescription}</p>
                    <div className="mt-6 rounded-lg border border-border bg-card p-5">
                        <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{c.citationLabel}</p>
                                <p className="mt-2 text-sm leading-6 text-foreground">{citation}</p>
                            </div>
                            <CopyButton value={citation} label={c.copy} copiedLabel={c.copied} />
                        </div>
                        <div className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{c.bibtexLabel}</p>
                                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-5 text-muted-foreground">{bibtex}</pre>
                            </div>
                            <CopyButton value={bibtex} label={c.copy} copiedLabel={c.copied} />
                        </div>
                        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                            <p className="max-w-xl text-xs leading-5 text-muted-foreground">{c.dataNotice}</p>
                            <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={downloadTeiXml} className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold hover:bg-muted transition-colors">
                                    <Download className="h-4 w-4 text-primary" aria-hidden="true" /> {lang === 'ar' ? 'تصدير TEI-XML' : lang === 'fr' ? 'Exporter TEI-XML' : 'Export TEI-XML'}
                                </button>
                                <button type="button" onClick={downloadMetadata} className="inline-flex h-9 items-center gap-2 rounded-md bg-secondary px-3 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90">
                                    <Download className="h-4 w-4" aria-hidden="true" /> {c.downloadMetadata}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </article>
    )
}
