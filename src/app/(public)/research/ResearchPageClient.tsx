'use client'

import Link from 'next/link'
import {
    ArrowRight,
    BookMarked,
    CheckCircle2,
    CircleDot,
    Database,
    Library,
    Quote,
    Scale,
    ScanLine,
    ShieldCheck,
} from 'lucide-react'
import { useLanguage, type Language } from '@/lib/language-context'
import type { ManuscriptCatalogSummary } from '@/lib/manuscripts'

type MethodItem = { title: string; description: string }
type StatusItem = { name: string; meaning: string; use: string }
type ResearchCopy = {
    eyebrow: string
    title: string
    description: string
    corpusLink: string
    contributeLink: string
    manuscripts: string
    pages: string
    segments: string
    validated: string
    metricsUnavailable: string
    corpusTitle: string
    corpusDescription: string
    corpusItems: MethodItem[]
    methodTitle: string
    methodDescription: string
    workflow: MethodItem[]
    statusesTitle: string
    statusesDescription: string
    statusLabel: string
    meaningLabel: string
    useLabel: string
    statuses: StatusItem[]
    principlesTitle: string
    principles: MethodItem[]
    reuseTitle: string
    reuseDescription: string
    reuseItems: string[]
    citationTitle: string
    citationText: string
    notice: string
}

const copy: Record<Language, ResearchCopy> = {
    fr: {
        eyebrow: 'Cadre scientifique', title: 'Méthodologie & réutilisation',
        description: 'Khatt-GPT documente chaque étape qui transforme un scan de manuscrit en donnée textuelle vérifiable. Cette page expose le protocole, les statuts et les limites du corpus.',
        corpusLink: 'Explorer le corpus', contributeLink: 'Participer à la transcription', manuscripts: 'Manuscrits', pages: 'Pages', segments: 'Lignes segmentées', validated: 'Lignes validées', metricsUnavailable: 'Les indicateurs en direct sont temporairement indisponibles.',
        corpusTitle: 'Unités documentaires', corpusDescription: 'Le corpus conserve le contexte nécessaire pour retourner de la transcription vers l’image source.',
        corpusItems: [
            { title: 'Notice de manuscrit', description: 'Titre, institution ou collection, description et ressources de référence.' },
            { title: 'Page numérisée', description: 'Image complète du témoin, ordonnée dans le volume.' },
            { title: 'Segment de ligne', description: 'Zone de lecture reliée à sa page et à sa position.' },
            { title: 'Proposition textuelle', description: 'Texte soumis, auteur, date, statut et récompense restent traçables.' },
        ],
        methodTitle: 'Chaîne de validation', methodDescription: 'Le consensus accélère la revue sans remplacer l’examen philologique.',
        workflow: [
            { title: '1. Segmenter', description: 'Un administrateur délimite les lignes et contrôle les erreurs de segmentation signalées.' },
            { title: '2. Transcrire en parallèle', description: 'Plusieurs personnes peuvent travailler sur la même ligne sans voir leur réponse avant soumission.' },
            { title: '3. Comparer', description: 'Les propositions sont normalisées puis rapprochées par similarité, en conservant les variantes.' },
            { title: '4. Valider', description: 'Le consensus ou une revue experte fixe le texte retenu et documente les conflits.' },
        ],
        statusesTitle: 'Lire les statuts', statusesDescription: 'Un statut décrit le niveau de maturité d’une ligne, pas la valeur du manuscrit.', statusLabel: 'Statut', meaningLabel: 'Signification', useLabel: 'Usage recommandé',
        statuses: [
            { name: 'En attente', meaning: 'Pas assez de propositions comparables.', use: 'Donnée de travail uniquement.' },
            { name: 'Conflit', meaning: 'Les lectures divergent au-delà du seuil de consensus.', use: 'À examiner par un lecteur compétent.' },
            { name: 'Validé', meaning: 'Consensus suffisant ou décision experte enregistrée.', use: 'Réutilisable avec citation de la version.' },
            { name: 'Signalé', meaning: 'La découpe ou l’image peut empêcher une lecture fiable.', use: 'Suspendre l’interprétation avant correction.' },
        ],
        principlesTitle: 'Principes de recherche', principles: [
            { title: 'Provenance', description: 'Les données restent reliées au manuscrit, à la page et à la ligne.' },
            { title: 'Incertitude visible', description: 'Les désaccords ne sont pas masqués et peuvent être réexaminés.' },
            { title: 'Attribution équitable', description: 'L’ordre de soumission et la contribution de chacun sont conservés.' },
            { title: 'Reproductibilité', description: 'Les exports incluent les images, statuts, textes et métadonnées disponibles.' },
        ],
        reuseTitle: 'Réutiliser le corpus', reuseDescription: 'Avant une analyse quantitative ou un entraînement HTR, filtrez les données selon leur statut et documentez la date d’accès.',
        reuseItems: ['Citer la notice du manuscrit et son identifiant KHATT.', 'Séparer les données validées des propositions en attente.', 'Conserver les images et polygones pour les travaux de segmentation.', 'Décrire tout nettoyage ou normalisation appliqué après export.'],
        citationTitle: 'Citation', citationText: 'Chaque notice fournit une citation recommandée, une entrée BibTeX et des métadonnées JSON téléchargeables.',
        notice: 'Le corpus est évolutif : les chiffres, statuts et textes peuvent changer après de nouvelles contributions ou une revue experte.',
    },
    en: {
        eyebrow: 'Scholarly framework', title: 'Methodology & reuse',
        description: 'Khatt-GPT documents every step that turns a manuscript scan into verifiable textual data. This page explains the protocol, statuses, and limits of the corpus.',
        corpusLink: 'Explore the corpus', contributeLink: 'Join transcription', manuscripts: 'Manuscripts', pages: 'Pages', segments: 'Segmented lines', validated: 'Validated lines', metricsUnavailable: 'Live corpus indicators are temporarily unavailable.',
        corpusTitle: 'Documentary units', corpusDescription: 'The corpus retains enough context to move from a transcription back to its source image.',
        corpusItems: [
            { title: 'Manuscript record', description: 'Title, holding institution or collection, description, and reference resources.' },
            { title: 'Digitized page', description: 'Full witness image ordered within the volume.' },
            { title: 'Line segment', description: 'Reading area linked to its page and position.' },
            { title: 'Textual proposal', description: 'Submitted text, contributor, date, status, and reward remain traceable.' },
        ],
        methodTitle: 'Validation pipeline', methodDescription: 'Consensus speeds up review without replacing philological examination.',
        workflow: [
            { title: '1. Segment', description: 'An administrator delineates lines and reviews reported segmentation issues.' },
            { title: '2. Transcribe independently', description: 'Several people may work on the same line without seeing prior answers before submission.' },
            { title: '3. Compare', description: 'Proposals are normalized and compared by similarity while variants remain available.' },
            { title: '4. Validate', description: 'Consensus or expert review establishes the retained text and documents conflicts.' },
        ],
        statusesTitle: 'Understanding statuses', statusesDescription: 'A status describes the maturity of a line, not the value of the manuscript.', statusLabel: 'Status', meaningLabel: 'Meaning', useLabel: 'Recommended use',
        statuses: [
            { name: 'Pending', meaning: 'Not enough comparable proposals.', use: 'Working data only.' },
            { name: 'Conflict', meaning: 'Readings diverge beyond the consensus threshold.', use: 'Requires a competent reader.' },
            { name: 'Validated', meaning: 'Sufficient consensus or a recorded expert decision.', use: 'Reusable with version citation.' },
            { name: 'Flagged', meaning: 'The crop or image may prevent reliable reading.', use: 'Suspend interpretation until corrected.' },
        ],
        principlesTitle: 'Research principles', principles: [
            { title: 'Provenance', description: 'Data remain linked to manuscript, page, and line.' },
            { title: 'Visible uncertainty', description: 'Disagreements are retained and can be revisited.' },
            { title: 'Fair attribution', description: 'Submission order and individual contributions remain recorded.' },
            { title: 'Reproducibility', description: 'Exports include available images, statuses, texts, and metadata.' },
        ],
        reuseTitle: 'Reusing the corpus', reuseDescription: 'Before quantitative analysis or HTR training, filter by status and document the access date.',
        reuseItems: ['Cite the manuscript record and its KHATT identifier.', 'Separate validated data from pending proposals.', 'Keep images and polygons for segmentation research.', 'Describe any cleaning or normalization performed after export.'],
        citationTitle: 'Citation', citationText: 'Each manuscript record provides a recommended citation, BibTeX entry, and downloadable JSON metadata.',
        notice: 'This is an evolving corpus: counts, statuses, and texts may change after new contributions or expert review.',
    },
    ar: {
        eyebrow: 'الإطار العلمي', title: 'المنهجية وإعادة الاستخدام',
        description: 'يوثّق KHATT-GPT كل مرحلة تحوّل صورة المخطوط إلى بيانات نصية قابلة للتحقق. تشرح هذه الصفحة البروتوكول والحالات وحدود المجموعة.',
        corpusLink: 'استكشاف المجموعة', contributeLink: 'المشاركة في النسخ', manuscripts: 'المخطوطات', pages: 'الصفحات', segments: 'الأسطر المجزأة', validated: 'الأسطر المعتمدة', metricsUnavailable: 'مؤشرات المجموعة المباشرة غير متاحة مؤقتاً.',
        corpusTitle: 'الوحدات الوثائقية', corpusDescription: 'تحتفظ المجموعة بالسياق اللازم للرجوع من النص المنسوخ إلى الصورة الأصلية.',
        corpusItems: [
            { title: 'بطاقة المخطوط', description: 'العنوان ومؤسسة الحفظ أو المجموعة والوصف والموارد المرجعية.' },
            { title: 'الصفحة الرقمية', description: 'صورة كاملة مرتبة ضمن المخطوط.' },
            { title: 'مقطع السطر', description: 'منطقة قراءة مرتبطة بالصفحة والموضع.' },
            { title: 'المقترح النصي', description: 'يبقى النص والمساهم والتاريخ والحالة قابلاً للتتبّع.' },
        ],
        methodTitle: 'مسار الاعتماد', methodDescription: 'يسرّع التوافق المراجعة ولا يحل محل الفحص العلمي.',
        workflow: [
            { title: '١. التجزئة', description: 'يحدّد المشرف الأسطر ويراجع مشكلات التجزئة المبلّغ عنها.' },
            { title: '٢. النسخ المستقل', description: 'يمكن لعدة أشخاص نسخ السطر نفسه دون رؤية الإجابات السابقة قبل الإرسال.' },
            { title: '٣. المقارنة', description: 'تُطبّع المقترحات وتُقارن مع الاحتفاظ بالاختلافات.' },
            { title: '٤. الاعتماد', description: 'يثبت التوافق أو المراجع المختص النص المختار ويوثّق التعارضات.' },
        ],
        statusesTitle: 'فهم الحالات', statusesDescription: 'تصف الحالة مستوى نضج السطر ولا تحكم على قيمة المخطوط.', statusLabel: 'الحالة', meaningLabel: 'المعنى', useLabel: 'الاستخدام المقترح',
        statuses: [
            { name: 'قيد الانتظار', meaning: 'لا توجد مقترحات كافية للمقارنة.', use: 'بيانات عمل فقط.' },
            { name: 'تعارض', meaning: 'تختلف القراءات فوق عتبة التوافق.', use: 'يحتاج إلى قارئ مختص.' },
            { name: 'معتمد', meaning: 'تحقق توافق كافٍ أو سُجّل قرار خبير.', use: 'قابل لإعادة الاستخدام مع ذكر النسخة.' },
            { name: 'مبلّغ عنه', meaning: 'قد تمنع الصورة أو التجزئة قراءة موثوقة.', use: 'تعليق التفسير حتى التصحيح.' },
        ],
        principlesTitle: 'مبادئ البحث', principles: [
            { title: 'المصدر', description: 'تبقى البيانات مرتبطة بالمخطوط والصفحة والسطر.' },
            { title: 'إظهار عدم اليقين', description: 'لا تُخفى الاختلافات ويمكن إعادة فحصها.' },
            { title: 'نسبة المساهمة', description: 'يُحفظ ترتيب الإرسال ومساهمة كل شخص.' },
            { title: 'قابلية التكرار', description: 'تضم الصادرات الصور والحالات والنصوص والبيانات الوصفية المتاحة.' },
        ],
        reuseTitle: 'إعادة استخدام المجموعة', reuseDescription: 'قبل التحليل الكمي أو تدريب HTR، صفِّ البيانات حسب الحالة ووثّق تاريخ الوصول.',
        reuseItems: ['اذكر بطاقة المخطوط ومعرّف KHATT في الاقتباس.', 'افصل البيانات المعتمدة عن المقترحات المعلّقة.', 'احتفظ بالصور والمضلعات لأبحاث التجزئة.', 'صِف أي تنظيف أو تطبيع يطبّق بعد التصدير.'],
        citationTitle: 'الاقتباس', citationText: 'توفّر كل بطاقة صيغة اقتباس مقترحة وBibTeX وبيانات JSON قابلة للتنزيل.',
        notice: 'المجموعة قابلة للتحديث: قد تتغير الأعداد والحالات والنصوص بعد مساهمات جديدة أو مراجعة علمية.',
    },
}

export function ResearchPageClient({ summary, summaryAvailable }: { summary: ManuscriptCatalogSummary; summaryAvailable: boolean }) {
    const { lang } = useLanguage()
    const c = copy[lang]
    const corpusIcons = [BookMarked, Library, ScanLine, Database]
    const principleIcons = [Library, CircleDot, Scale, ShieldCheck]

    return (
        <article className="w-full min-w-0 px-4 pb-16 pt-10 sm:px-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <header className="border-b border-border pb-10">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{c.eyebrow}</p>
                <h1 className="mt-3 max-w-4xl font-heading text-4xl font-semibold leading-tight sm:text-5xl">{c.title}</h1>
                <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">{c.description}</p>
                <div className="mt-7 flex flex-wrap gap-3">
                    <Link href="/corpus" className="inline-flex max-w-full h-10 items-center justify-center gap-2 whitespace-normal rounded-md bg-secondary px-4 text-center text-sm font-semibold text-secondary-foreground hover:bg-secondary/90">
                        {c.corpusLink} <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                    </Link>
                    <Link href="/auth/register" className="inline-flex max-w-full h-10 items-center justify-center gap-2 whitespace-normal rounded-md border border-border px-4 text-center text-sm font-semibold hover:bg-muted">{c.contributeLink}</Link>
                </div>
                <div className="mt-9 grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-4">
                    {[
                        { label: c.manuscripts, value: summary.manuscripts },
                        { label: c.pages, value: summary.pages },
                        { label: c.segments, value: summary.segments },
                        { label: c.validated, value: summary.validated },
                    ].map((item) => <div key={item.label} className="border-l border-border pl-4 first:border-l-0 first:pl-0 rtl:border-l-0 rtl:border-r rtl:pl-0 rtl:pr-4 rtl:first:border-r-0 rtl:first:pr-0"><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{item.label}</p><p className="mt-2 text-3xl font-semibold tabular-nums">{summaryAvailable ? item.value.toLocaleString() : '—'}</p></div>)}
                </div>
                {!summaryAvailable ? <p className="mt-4 text-xs font-medium text-muted-foreground">{c.metricsUnavailable}</p> : null}
            </header>

            <section className="border-b border-border py-11">
                <h2 className="font-heading text-3xl font-semibold">{c.corpusTitle}</h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{c.corpusDescription}</p>
                <div className="mt-8 grid gap-7 md:grid-cols-2 lg:grid-cols-4">
                    {c.corpusItems.map((item, index) => {
                        const Icon = corpusIcons[index]
                        return <div key={item.title} className="border-t-2 border-secondary pt-4"><Icon className="h-5 w-5 text-secondary" aria-hidden="true" /><h3 className="mt-4 font-semibold">{item.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p></div>
                    })}
                </div>
            </section>

            <section className="border-b border-border py-11">
                <h2 className="font-heading text-3xl font-semibold">{c.methodTitle}</h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{c.methodDescription}</p>
                <ol className="mt-8 grid gap-0 md:grid-cols-4">
                    {c.workflow.map((item, index) => <li key={item.title} className="relative border-l border-border pb-8 pl-6 last:pb-0 md:border-l-0 md:border-t md:pb-0 md:pl-0 md:pt-6 rtl:border-l-0 rtl:border-r rtl:pl-0 rtl:pr-6 md:rtl:border-r-0 md:rtl:pr-0"><span className="absolute -left-1.5 top-0 h-3 w-3 rounded-full border-2 border-secondary bg-background md:-top-1.5 md:left-0 rtl:-right-1.5 md:rtl:right-auto" /><p className="font-mono text-xs font-bold text-primary">0{index + 1}</p><h3 className="mt-2 font-semibold">{item.title}</h3><p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground md:pr-6 rtl:md:pl-6 rtl:md:pr-0">{item.description}</p></li>)}
                </ol>
            </section>

            <section className="border-b border-border py-11">
                <h2 className="font-heading text-3xl font-semibold">{c.statusesTitle}</h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{c.statusesDescription}</p>
                <div className="mt-7 overflow-x-auto rounded-lg border border-border">
                    <table className="w-full min-w-[720px] border-collapse text-sm">
                        <thead className="bg-muted/40 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground rtl:text-right"><tr><th className="px-4 py-3">{c.statusLabel}</th><th className="px-4 py-3">{c.meaningLabel}</th><th className="px-4 py-3">{c.useLabel}</th></tr></thead>
                        <tbody>{c.statuses.map((status) => <tr key={status.name} className="border-t border-border"><td className="px-4 py-4 font-semibold">{status.name}</td><td className="px-4 py-4 text-muted-foreground">{status.meaning}</td><td className="px-4 py-4 text-muted-foreground">{status.use}</td></tr>)}</tbody>
                    </table>
                </div>
            </section>

            <section className="grid gap-12 border-b border-border py-11 lg:grid-cols-2">
                <div>
                    <h2 className="font-heading text-3xl font-semibold">{c.principlesTitle}</h2>
                    <div className="mt-7 grid gap-6 sm:grid-cols-2">
                        {c.principles.map((item, index) => { const Icon = principleIcons[index]; return <div key={item.title} className="flex gap-3"><Icon className="mt-0.5 h-5 w-5 shrink-0 text-secondary" aria-hidden="true" /><div><h3 className="font-semibold">{item.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p></div></div> })}
                    </div>
                </div>
                <div>
                    <h2 className="font-heading text-3xl font-semibold">{c.reuseTitle}</h2>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{c.reuseDescription}</p>
                    <ul className="mt-6 space-y-3">{c.reuseItems.map((item) => <li key={item} className="flex gap-3 text-sm leading-6"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-green-700" aria-hidden="true" /><span>{item}</span></li>)}</ul>
                </div>
            </section>

            <section className="py-11">
                <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
                    <div><Quote className="h-7 w-7 text-primary" aria-hidden="true" /><h2 className="mt-4 font-heading text-3xl font-semibold">{c.citationTitle}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{c.citationText}</p></div>
                    <div className="rounded-lg border border-border bg-card p-6"><p className="text-sm leading-7 text-foreground">{c.notice}</p></div>
                </div>
            </section>
        </article>
    )
}
