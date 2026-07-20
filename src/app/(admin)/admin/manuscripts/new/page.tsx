'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createManuscriptRecord } from '../actions'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { ChevronLeft, FolderOpen, FileImage, LineChart } from 'lucide-react'
import { useLanguage, type Language } from '@/lib/language-context'

const copy: Record<Language, Record<string, string>> = {
    en: {
        back: 'Back to Manuscripts',
        title: 'Create New Manuscript',
        description: 'Create the scholarly container first, then add full-page scans and line crops for collaborative transcription.',
        step1: 'Create Manuscript',
        step1Desc: 'Title, source, notes',
        step2: 'Add Pages',
        step2Desc: 'Upload full scans',
        step3: 'Add Lines',
        step3Desc: 'Batch line images',
        formTitle: 'Step 1 - Manuscript Details',
        manuscriptTitle: 'Title',
        titlePlaceholder: 'e.g. Kitab al-Shifa',
        source: 'Source / Collection',
        sourcePlaceholder: 'e.g. National Library of Morocco',
        pdf: 'PDF URL',
        pdfPlaceholder: 'Optional link to a hosted PDF',
        pdfHint: 'Optional. You can also upload or change the PDF after creation.',
        notes: 'Description',
        notesPlaceholder: 'Historical context, shelfmark, folio range, script, or contributor notes...',
        missingTitle: 'Add a title before creating the manuscript.',
        invalidPdf: 'Enter a valid http(s) PDF URL, or leave it empty.',
        successTitle: 'Manuscript created',
        successDesc: 'Now add pages and line images.',
        errorTitle: 'Creation failed',
        creating: 'Creating...',
        submit: 'Create Manuscript & Add Pages'
    },
    fr: {
        back: 'Retour aux manuscrits',
        title: 'Créer un nouveau manuscrit',
        description: "Créez d'abord le conteneur scientifique, puis ajoutez les scans de pages et les lignes à transcrire collectivement.",
        step1: 'Créer le manuscrit',
        step1Desc: 'Titre, source, notes',
        step2: 'Ajouter les pages',
        step2Desc: 'Scans complets',
        step3: 'Ajouter les lignes',
        step3Desc: 'Import par lots',
        formTitle: 'Étape 1 - Détails du manuscrit',
        manuscriptTitle: 'Titre',
        titlePlaceholder: 'ex. Kitab al-Shifa',
        source: 'Source / Collection',
        sourcePlaceholder: 'ex. Bibliothèque nationale du Maroc',
        pdf: 'URL du PDF',
        pdfPlaceholder: 'Lien optionnel vers un PDF hébergé',
        pdfHint: 'Optionnel. Vous pourrez aussi ajouter ou modifier le PDF après création.',
        notes: 'Description',
        notesPlaceholder: "Contexte historique, cote, folios, type d'écriture, consignes pour les contributeurs...",
        missingTitle: 'Ajoutez un titre avant de créer le manuscrit.',
        invalidPdf: 'Saisissez une URL PDF http(s) valide, ou laissez le champ vide.',
        successTitle: 'Manuscrit créé',
        successDesc: 'Vous pouvez maintenant ajouter les pages et les lignes.',
        errorTitle: 'Creation impossible',
        creating: 'Création...',
        submit: 'Créer le manuscrit et ajouter les pages'
    },
    ar: {
        back: 'العودة إلى المخطوطات',
        title: 'إنشاء مخطوط جديد',
        description: 'أنشئ الحاوية العلمية أولا، ثم أضف صور الصفحات والأسطر ليعمل المساهمون على نسخها.',
        step1: 'إنشاء المخطوط',
        step1Desc: 'العنوان، المصدر، الملاحظات',
        step2: 'إضافة الصفحات',
        step2Desc: 'صور الصفحات الكاملة',
        step3: 'إضافة الأسطر',
        step3Desc: 'رفع الأسطر دفعة واحدة',
        formTitle: 'الخطوة ١ - تفاصيل المخطوط',
        manuscriptTitle: 'العنوان',
        titlePlaceholder: 'مثال: كتاب الشفاء',
        source: 'المصدر / المجموعة',
        sourcePlaceholder: 'مثال: المكتبة الوطنية للمغرب',
        pdf: 'رابط PDF',
        pdfPlaceholder: 'رابط اختياري لملف PDF منشور',
        pdfHint: 'اختياري. يمكن أيضا رفع الملف أو تعديله بعد الإنشاء.',
        notes: 'الوصف',
        notesPlaceholder: 'السياق التاريخي، رقم الحفظ، نطاق الأوراق، نوع الخط، أو تعليمات للمساهمين...',
        missingTitle: 'أضف عنوانا قبل إنشاء المخطوط.',
        invalidPdf: 'أدخل رابط PDF صالحا يبدأ بـ http(s)، أو اترك الحقل فارغا.',
        successTitle: 'تم إنشاء المخطوط',
        successDesc: 'يمكنك الآن إضافة الصفحات والأسطر.',
        errorTitle: 'تعذر الإنشاء',
        creating: 'جار الإنشاء...',
        submit: 'إنشاء المخطوط وإضافة الصفحات'
    }
}

export default function NewManuscriptPage() {
    const { lang } = useLanguage()
    const c = copy[lang]
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [source, setSource] = useState('')
    const [pdfUrl, setPdfUrl] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const router = useRouter()
    const { toast } = useToast()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!title.trim()) {
            toast({ title: c.errorTitle, description: c.missingTitle, variant: 'destructive' })
            return
        }

        if (pdfUrl.trim()) {
            try {
                const parsed = new URL(pdfUrl.trim())
                if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error()
            } catch {
                toast({ title: c.errorTitle, description: c.invalidPdf, variant: 'destructive' })
                return
            }
        }

        setSubmitting(true)

        const result = await createManuscriptRecord({
            title: title.trim(),
            description: description.trim(),
            source: source.trim(),
            segmentsCount: 0,
            coverUrl: '',
            pdfUrl: pdfUrl.trim()
        })

        if (result.error) {
            toast({ title: c.errorTitle, description: result.error, variant: 'destructive' })
            setSubmitting(false)
            return
        }

        toast({ title: c.successTitle, description: c.successDesc })
        router.push(`/admin/manuscripts/${result.id}`)
        router.refresh()
    }

    return (
        <div className="max-w-2xl mx-auto py-10 flex flex-col gap-8" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="flex flex-col gap-2">
                <Link href="/admin/manuscripts" className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2">
                    <ChevronLeft className="w-4 h-4" /> {c.back}
                </Link>
                <h1 className="text-3xl font-heading font-semibold">{c.title}</h1>
                <p className="text-muted-foreground">{c.description}</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {[
                    { step: '1', icon: FolderOpen, label: c.step1, desc: c.step1Desc },
                    { step: '2', icon: FileImage, label: c.step2, desc: c.step2Desc },
                    { step: '3', icon: LineChart, label: c.step3, desc: c.step3Desc },
                ].map(item => (
                    <div key={item.step} className="flex flex-col items-center text-center gap-2 p-4 rounded-xl bg-primary/5 border border-primary/10">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-sm">
                            {item.step}
                        </div>
                        <item.icon className="w-5 h-5 text-primary/70" />
                        <span className="font-medium text-sm">{item.label}</span>
                        <span className="text-xs text-muted-foreground">{item.desc}</span>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="bg-card border border-border p-8 rounded-xl shadow-sm flex flex-col gap-6">
                <h2 className="font-semibold text-lg border-b border-border pb-2">{c.formTitle}</h2>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">{c.manuscriptTitle} <span className="text-destructive">*</span></label>
                    <input
                        required
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                        placeholder={c.titlePlaceholder}
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">{c.source}</label>
                    <input
                        value={source}
                        onChange={e => setSource(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                        placeholder={c.sourcePlaceholder}
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">{c.pdf}</label>
                    <input
                        type="url"
                        value={pdfUrl}
                        onChange={e => setPdfUrl(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                        placeholder={c.pdfPlaceholder}
                    />
                    <p className="text-xs text-muted-foreground">{c.pdfHint}</p>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">{c.notes}</label>
                    <textarea
                        rows={3}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none resize-y"
                        placeholder={c.notesPlaceholder}
                    />
                </div>

                <Button type="submit" disabled={submitting || !title.trim()} className="w-full h-12 text-base">
                    {submitting ? c.creating : c.submit}
                </Button>
            </form>
        </div>
    )
}
