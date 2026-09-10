'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createManuscriptRecord } from '../actions'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { ChevronLeft, FolderOpen, FileImage, LineChart, Sparkles, BookOpen, ScrollText } from 'lucide-react'
import { useLanguage, type Language } from '@/lib/language-context'

const SCRIPT_OPTIONS = [
    { value: 'Maghrebi Mabsut', labelFr: 'Maghrébin Mabsout (Clair & aéré)', labelAr: 'مغربي مبسوط', labelEn: 'Maghrebi Mabsut (Clear & formal)' },
    { value: 'Maghrebi Mujawhar', labelFr: 'Maghrébin Mujawhar (Cursif courant)', labelAr: 'مغربي مجوهر', labelEn: 'Maghrebi Mujawhar (Running cursive)' },
    { value: 'Maghrebi Thuluth', labelFr: 'Thuluth Maghrébin (Titres & enluminures)', labelAr: 'ثلث مغربي', labelEn: 'Maghrebi Thuluth (Display & headings)' },
    { value: 'Maghrebi Sahrawi', labelFr: 'Sahraoui / Soudani (Ouest-Africain)', labelAr: 'صحراوي / سوداني', labelEn: 'Sahrawi / Sudani (West African / Saharan)' },
    { value: 'Andalusi', labelFr: 'Andalou (Compact & fin)', labelAr: 'أندلسي', labelEn: 'Andalusi (Fine & compact)' },
    { value: 'Other', labelFr: 'Autre style maghrébin', labelAr: 'خط مغربي آخر', labelEn: 'Other Maghrebi style' }
]

const INSTITUTION_PRESETS = [
    { name: 'Bibliothèque Nationale du Royaume du Maroc (BNRM)', city: 'Rabat' },
    { name: 'Bibliothèque Nationale de France (BnF)', city: 'Paris' },
    { name: 'Bibliothèque Daoudia', city: 'Tétouan' },
    { name: 'Université Al-Qarawiyyin', city: 'Fès' },
    { name: 'Bibliothèque Royale (Hassania)', city: 'Rabat' },
    { name: 'Leiden University Libraries', city: 'Leiden' },
]

export default function NewManuscriptPage() {
    const { lang } = useLanguage()
    const router = useRouter()
    const { toast } = useToast()

    const [title, setTitle] = useState('')
    const [author, setAuthor] = useState('')
    const [source, setSource] = useState('')
    const [shelfmark, setShelfmark] = useState('')
    const [scriptType, setScriptType] = useState('Maghrebi Mabsut')
    const [century, setCentury] = useState('')
    const [pdfUrl, setPdfUrl] = useState('')
    const [description, setDescription] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!title.trim()) {
            toast({ 
                title: lang === 'ar' ? 'العنوان مطلوب' : 'Titre requis', 
                description: lang === 'ar' ? 'أضف عنوانا قبل إنشاء المخطوط.' : 'Ajoutez un titre avant de créer le manuscrit.', 
                variant: 'destructive' 
            })
            return
        }

        if (pdfUrl.trim()) {
            try {
                const parsed = new URL(pdfUrl.trim())
                if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error()
            } catch {
                toast({ 
                    title: lang === 'ar' ? 'رابط غير صالح' : 'URL invalide', 
                    description: lang === 'ar' ? 'أدخل رابط PDF صالحا يبدأ بـ http(s).' : 'Saisissez une URL PDF http(s) valide.', 
                    variant: 'destructive' 
                })
                return
            }
        }

        setSubmitting(true)

        const result = await createManuscriptRecord({
            title: title.trim(),
            description: description.trim(),
            source: source.trim(),
            author: author.trim(),
            shelfmark: shelfmark.trim(),
            scriptType: scriptType.trim(),
            century: century.trim(),
            segmentsCount: 0,
            coverUrl: '',
            pdfUrl: pdfUrl.trim()
        })

        if (result.error) {
            toast({ 
                title: lang === 'ar' ? 'تعذر الإنشاء' : 'Création impossible', 
                description: result.error, 
                variant: 'destructive' 
            })
            setSubmitting(false)
            return
        }

        toast({ 
            title: lang === 'ar' ? 'تم إنشاء المخطوط' : 'Manuscrit créé', 
            description: lang === 'ar' ? 'يمكنك الآن إضافة الصفحات والأسطر دفعة واحدة.' : 'Vous pouvez maintenant ajouter les scans de pages et les lignes.' 
        })
        router.push(`/admin/manuscripts/${result.id}`)
        router.refresh()
    }

    return (
        <div className="max-w-3xl mx-auto py-8 flex flex-col gap-8" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="flex flex-col gap-2">
                <Link href="/admin/manuscripts" className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2">
                    <ChevronLeft className="w-4 h-4 rtl:rotate-180" /> {lang === 'ar' ? 'العودة إلى المخطوطات' : 'Retour aux manuscrits'}
                </Link>
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                        <ScrollText className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-heading font-semibold text-foreground">
                            {lang === 'ar' ? 'إضافة مخطوط جديد' : 'Ajouter un nouveau manuscrit'}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {lang === 'ar' 
                                ? 'أنشئ السجل العلمي أولاً ببياناته الدقيقة، ثم انتقل فوراً لرفع حزم الصفحات والأسطر.'
                                : 'Créez la notice scientifique avec ses métadonnées, puis importez les scans de pages et les lignes.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Stepper explicatif */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { step: '1', icon: FolderOpen, label: lang === 'ar' ? '١. Notice & Métadonnées' : '1. Notice scientifique', desc: lang === 'ar' ? 'العنوان، المؤلف، الكود' : 'Titre, cote, graphie, siècle' },
                    { step: '2', icon: FileImage, label: lang === 'ar' ? '٢. Scans de pages' : '2. Scans des pages', desc: lang === 'ar' ? 'رفع جماعي للصور' : 'Upload Zip ou direct' },
                    { step: '3', icon: LineChart, label: lang === 'ar' ? '٣. Lignes & HTR' : '3. Découpe & Transcription', desc: lang === 'ar' ? 'إطلاق العمل الجماعي' : 'Consensus et réutilisation' },
                ].map(item => (
                    <div key={item.step} className="flex flex-col items-center text-center gap-1.5 p-4 rounded-xl bg-card border border-border">
                        <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-sm">
                            {item.step}
                        </div>
                        <item.icon className="w-4 h-4 text-primary/80 mt-1" />
                        <span className="font-semibold text-xs text-foreground">{item.label}</span>
                        <span className="text-[11px] text-muted-foreground">{item.desc}</span>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="bg-card border border-border p-6 sm:p-8 rounded-2xl shadow-sm flex flex-col gap-6">
                
                <div>
                    <h2 className="font-heading font-semibold text-lg text-foreground border-b border-border pb-3 mb-5 flex items-center justify-between">
                        <span>{lang === 'ar' ? 'المعطيات التوثيقية للمخطوط' : 'Notice scientifique & Codicologie'}</span>
                        <span className="text-xs text-muted-foreground font-mono uppercase">Étape 1/2</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-foreground mb-1.5">
                                {lang === 'ar' ? 'عنوان المخطوط *' : 'Titre du manuscrit *'}
                            </label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={lang === 'ar' ? 'مثال: كتاب الشفاء بتعريف حقوق المصطفى' : 'ex. Kitāb al-Shifāʾ bi-taʿrīf ḥuqūq al-Muṣṭafā'}
                                className="w-full h-11 px-3.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-1.5">
                                {lang === 'ar' ? 'المؤلف / الناسخ' : 'Auteur / Copiste'}
                            </label>
                            <input
                                type="text"
                                value={author}
                                onChange={(e) => setAuthor(e.target.value)}
                                placeholder={lang === 'ar' ? 'مثال: القاضي عياض' : 'ex. Al-Qāḍī ʿIyāḍ'}
                                className="w-full h-11 px-3.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-1.5">
                                {lang === 'ar' ? 'رقم الحفظ / الكود (Shelfmark)' : 'Cote de conservation (Shelfmark)'}
                            </label>
                            <input
                                type="text"
                                value={shelfmark}
                                onChange={(e) => setShelfmark(e.target.value)}
                                placeholder={lang === 'ar' ? 'مثال: BNRM 1428 د أو BnF Arabe 582' : 'ex. BNRM 1428 D ou BnF Arabe 582'}
                                className="w-full h-11 px-3.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-sm font-semibold text-foreground">
                                    {lang === 'ar' ? 'مؤسسة الحفظ / الخزانة' : 'Institution / Collection de conservation'}
                                </label>
                                <span className="text-[11px] text-muted-foreground">
                                    {lang === 'ar' ? 'تحديد سريع :' : 'Suggestions rapides :'}
                                </span>
                            </div>
                            <input
                                type="text"
                                value={source}
                                onChange={(e) => setSource(e.target.value)}
                                placeholder={lang === 'ar' ? 'مثال: المكتبة الوطنية للمملكة المغربية' : 'ex. Bibliothèque Nationale du Royaume du Maroc (BNRM)'}
                                className="w-full h-11 px-3.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary mb-2"
                            />
                            <div className="flex flex-wrap gap-1.5">
                                {INSTITUTION_PRESETS.map(inst => (
                                    <button
                                        key={inst.name}
                                        type="button"
                                        onClick={() => setSource(inst.name)}
                                        className="text-[11px] px-2.5 py-1 rounded-md border border-border/80 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {inst.name.split('(')[0].trim()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-1.5">
                                {lang === 'ar' ? 'أسلوب الخط المغربي' : 'Style de graphie maghrébine'}
                            </label>
                            <select
                                value={scriptType}
                                onChange={(e) => setScriptType(e.target.value)}
                                className="w-full h-11 px-3.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            >
                                {SCRIPT_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                        {lang === 'ar' ? opt.labelAr : opt.labelFr}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-1.5">
                                {lang === 'ar' ? 'القرن / الحقبة التقديرية' : 'Siècle ou datation estimée'}
                            </label>
                            <input
                                type="text"
                                value={century}
                                onChange={(e) => setCentury(e.target.value)}
                                placeholder={lang === 'ar' ? 'مثال: القرن ٨ هـ / ١٤ م' : 'ex. VIIIe s. H. / XIVe s. EC'}
                                className="w-full h-11 px-3.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-foreground mb-1.5">
                                {lang === 'ar' ? 'رابط ملف PDF الكامل (اختياري)' : 'URL du fac-similé PDF intégral (optionnel)'}
                            </label>
                            <input
                                type="url"
                                value={pdfUrl}
                                onChange={(e) => setPdfUrl(e.target.value)}
                                placeholder="https://..."
                                className="w-full h-11 px-3.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                            <p className="mt-1 text-xs text-muted-foreground">
                                {lang === 'ar' ? 'يمكنك أيضاً رفع ملف PDF مباشرة من صفحة المخطوط بعد إنشائه.' : 'Vous pourrez également téléverser le fichier PDF directement depuis la page du manuscrit.'}
                            </p>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-foreground mb-1.5">
                                {lang === 'ar' ? 'الوصف والملاحظات العلمية' : 'Description & contexte scientifique'}
                            </label>
                            <textarea
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder={lang === 'ar' 
                                    ? 'السياق التاريخي، حالة الحفظ، الترقيم الورقي، أو تعليمات خاصة للمساهمين...'
                                    : 'Contexte historique, état du témoin, foliotation, particularités de la copie...'}
                                className="w-full p-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary leading-relaxed"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                    <Button variant="ghost" asChild>
                        <Link href="/admin/manuscripts">
                            {lang === 'ar' ? 'إلغاء' : 'Annuler'}
                        </Link>
                    </Button>
                    <Button type="submit" disabled={submitting} size="lg" className="gap-2 font-semibold">
                        {submitting ? (
                            <span>{lang === 'ar' ? 'جارٍ الإنشاء...' : 'Création en cours...'}</span>
                        ) : (
                            <>
                                <span>{lang === 'ar' ? 'إنشاء المخطوط والانتقال لرفع الصفحات' : 'Créer le manuscrit & passer aux scans'}</span>
                                <ChevronLeft className="w-4 h-4 rtl:rotate-0 rotate-180" />
                            </>
                        )}
                    </Button>
                </div>

            </form>
        </div>
    )
}
