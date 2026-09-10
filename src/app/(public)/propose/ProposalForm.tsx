'use client'

import { useState } from 'react'
import { useLanguage, type Language } from '@/lib/language-context'
import { submitManuscriptProposal } from './actions'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { 
    BookOpen, CheckCircle2, ChevronRight, FileText, 
    Globe, GraduationCap, Landmark, Send, Sparkles 
} from 'lucide-react'

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

export function ProposalForm() {
    const { lang } = useLanguage()
    const { toast } = useToast()

    const [title, setTitle] = useState('')
    const [author, setAuthor] = useState('')
    const [institution, setInstitution] = useState('')
    const [shelfmark, setShelfmark] = useState('')
    const [scriptType, setScriptType] = useState('Maghrebi Mabsut')
    const [century, setCentury] = useState('')
    const [facsimileUrl, setFacsimileUrl] = useState('')
    const [proposerName, setProposerName] = useState('')
    const [proposerEmail, setProposerEmail] = useState('')
    const [proposerAffiliation, setProposerAffiliation] = useState('')
    const [scholarlyJustification, setScholarlyJustification] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [submittedId, setSubmittedId] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!title.trim()) {
            toast({
                title: lang === 'ar' ? 'العنوان مطلوب' : lang === 'fr' ? 'Titre requis' : 'Title is required',
                description: lang === 'ar' ? 'يرجى إدخال عنوان المخطوط المقترح.' : lang === 'fr' ? 'Veuillez renseigner le titre du manuscrit.' : 'Please enter the manuscript title.',
                variant: 'destructive'
            })
            return
        }

        if (!proposerName.trim() || !proposerEmail.trim()) {
            toast({
                title: lang === 'ar' ? 'بيانات الباحث مطلوبة' : lang === 'fr' ? 'Coordonnées requises' : 'Contact info required',
                description: lang === 'ar' ? 'يرجى تقديم اسمك وبريدك الإلكتروني لتتبع المقترح.' : lang === 'fr' ? 'Veuillez indiquer votre nom et email pour le suivi.' : 'Please provide your name and email.',
                variant: 'destructive'
            })
            return
        }

        setSubmitting(true)
        const result = await submitManuscriptProposal({
            title,
            author,
            institution,
            shelfmark,
            scriptType,
            century,
            facsimileUrl,
            proposerName,
            proposerEmail,
            proposerAffiliation,
            scholarlyJustification,
        })
        setSubmitting(false)

        if (result.error) {
            toast({
                title: lang === 'ar' ? 'تعذر الإرسال' : lang === 'fr' ? 'Échec de la soumission' : 'Submission failed',
                description: result.error,
                variant: 'destructive'
            })
            return
        }

        setSubmittedId(result.id || 'ok')
        toast({
            title: lang === 'ar' ? 'تم استلام المقترح بنجاح' : lang === 'fr' ? 'Proposition reçue avec succès' : 'Proposal received successfully',
            description: lang === 'ar' ? 'شكراً لمساهمتكم في إثراء البحث العلمي.' : lang === 'fr' ? 'Merci pour votre contribution au corpus scientifique.' : 'Thank you for contributing to the research corpus.'
        })
    }

    if (submittedId) {
        return (
            <div className="rounded-2xl border border-primary/20 bg-card p-8 sm:p-12 text-center shadow-lg animate-in fade-in zoom-in-95 duration-300">
                <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-9 h-9" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-3">
                    {lang === 'ar' ? 'تم تسجيل مقترحكم العلمي' : lang === 'fr' ? 'Votre proposition a bien été enregistrée' : 'Your proposal has been registered'}
                </h2>
                <p className="text-muted-foreground max-w-xl mx-auto mb-6 text-sm sm:text-base leading-relaxed">
                    {lang === 'ar' 
                        ? 'سيقوم الفريق العلمي بمراجعة معطيات المخطوط والتحقق من جودة الصور وروابط الأرشيف لإضافته إلى قائمة النسخ والتدريب.'
                        : lang === 'fr'
                        ? 'Le comité scientifique va examiner les métadonnées paléographiques et l\'accès aux fac-similés pour intégration au corpus d\'entraînement HTR.'
                        : 'Our scientific committee will review the paleographic metadata and digital access for incorporation into the HTR dataset.'}
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted border border-border text-xs font-mono text-muted-foreground mb-8">
                    <span>ID : {submittedId}</span>
                </div>
                <div className="flex flex-wrap justify-center gap-4">
                    <Button onClick={() => { setSubmittedId(null); setTitle(''); setFacsimileUrl(''); setScholarlyJustification(''); }} variant="outline">
                        {lang === 'ar' ? 'اقتراح مخطوط آخر' : lang === 'fr' ? 'Proposer un autre manuscrit' : 'Suggest another manuscript'}
                    </Button>
                    <Button asChild>
                        <Link href="/corpus">
                            {lang === 'ar' ? 'تصفح المجموعة الحالية' : lang === 'fr' ? 'Consulter le corpus existant' : 'Explore current corpus'}
                        </Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-10" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            
            {/* Section 1 : Identification */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
                <div className="flex items-center gap-3 border-b border-border/60 pb-4 mb-6">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-heading font-semibold text-foreground">
                            {lang === 'ar' ? '١. تعريف المخطوط (الشاهد النصي)' : lang === 'fr' ? '1. Identification du manuscrit (Témoin)' : '1. Manuscript Identification (Witness)'}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            {lang === 'ar' ? 'العنوان، المؤلف، ومؤسسة الحفظ' : lang === 'fr' ? 'Titre de l\'œuvre, auteur et institution de conservation' : 'Work title, author and holding repository'}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-foreground mb-2">
                            {lang === 'ar' ? 'عنوان المخطوط *' : lang === 'fr' ? 'Titre du manuscrit *' : 'Manuscript Title *'}
                        </label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={lang === 'ar' ? 'مثال: كتاب الشفاء بتعريف حقوق المصطفى' : lang === 'fr' ? 'ex. Kitāb al-Shifāʾ bi-taʿrīf ḥuqūq al-Muṣṭafā' : 'e.g. Kitab al-Shifa'}
                            className="w-full h-11 px-3.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                            {lang === 'ar' ? 'المؤلف / الناسخ' : lang === 'fr' ? 'Auteur / Copiste' : 'Author / Scribe'}
                        </label>
                        <input
                            type="text"
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            placeholder={lang === 'ar' ? 'مثال: القاضي عياض بن موسى اليحصبي' : lang === 'fr' ? 'ex. Al-Qāḍī ʿIyāḍ' : 'e.g. Al-Qadi Iyad'}
                            className="w-full h-11 px-3.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                            {lang === 'ar' ? 'رقم الحفظ / الحفظ الخزائني (Cote)' : lang === 'fr' ? 'Cote de conservation (Shelfmark)' : 'Shelfmark / Call Number'}
                        </label>
                        <input
                            type="text"
                            value={shelfmark}
                            onChange={(e) => setShelfmark(e.target.value)}
                            placeholder={lang === 'ar' ? 'مثال: BNRM 1428 د أو BnF Arabe 582' : lang === 'fr' ? 'ex. BNRM 1428 D ou BnF Arabe 582' : 'e.g. BnF Arabe 582'}
                            className="w-full h-11 px-3.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-semibold text-foreground">
                                {lang === 'ar' ? 'المؤسسة أو الخزانة الحافظة' : lang === 'fr' ? 'Institution ou bibliothèque de conservation' : 'Holding Institution / Repository'}
                            </label>
                            <span className="text-[11px] text-muted-foreground">
                                {lang === 'ar' ? 'اختصارات شائعة :' : lang === 'fr' ? 'Suggestions rapides :' : 'Quick select:'}
                            </span>
                        </div>
                        <input
                            type="text"
                            value={institution}
                            onChange={(e) => setInstitution(e.target.value)}
                            placeholder={lang === 'ar' ? 'مثال: المكتبة الوطنية للمملكة المغربية - الرباط' : lang === 'fr' ? 'ex. Bibliothèque Nationale du Royaume du Maroc (BNRM)' : 'e.g. National Library of Morocco'}
                            className="w-full h-11 px-3.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary mb-2"
                        />
                        <div className="flex flex-wrap gap-1.5">
                            {INSTITUTION_PRESETS.map(inst => (
                                <button
                                    key={inst.name}
                                    type="button"
                                    onClick={() => setInstitution(inst.name)}
                                    className="text-[11px] px-2.5 py-1 rounded-md border border-border/80 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {inst.name.split('(')[0].trim()}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 2 : Paléographie & Datation */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
                <div className="flex items-center gap-3 border-b border-border/60 pb-4 mb-6">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-heading font-semibold text-foreground">
                            {lang === 'ar' ? '٢. الخصائص الخطية والتاريخية' : lang === 'fr' ? '2. Caractéristiques paléographiques & datation' : '2. Paleography & Chronology'}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            {lang === 'ar' ? 'نمط الخط المغربي والحقبة التاريخية المقدرة' : lang === 'fr' ? 'Style d\'écriture maghrébine et période historique' : 'Maghrebi script taxonomy and period'}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                            {lang === 'ar' ? 'أسلوب الخط المغربي' : lang === 'fr' ? 'Style de graphie maghrébine' : 'Maghrebi Script Style'}
                        </label>
                        <select
                            value={scriptType}
                            onChange={(e) => setScriptType(e.target.value)}
                            className="w-full h-11 px-3.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                            {SCRIPT_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                    {lang === 'ar' ? opt.labelAr : lang === 'fr' ? opt.labelFr : opt.labelEn}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                            {lang === 'ar' ? 'القرن أو تاريخ النسخ التقديري' : lang === 'fr' ? 'Siècle ou datation estimée' : 'Estimated Century / Dating'}
                        </label>
                        <input
                            type="text"
                            value={century}
                            onChange={(e) => setCentury(e.target.value)}
                            placeholder={lang === 'ar' ? 'مثال: القرن ٨ هـ / ١٤ م' : lang === 'fr' ? 'ex. VIIIe s. H. / XIVe s. EC' : 'e.g. 14th century CE'}
                            className="w-full h-11 px-3.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>
                </div>
            </div>

            {/* Section 3 : Accès Numérique & Fac-similé */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
                <div className="flex items-center gap-3 border-b border-border/60 pb-4 mb-6">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                        <Globe className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-heading font-semibold text-foreground">
                            {lang === 'ar' ? '٣. المصدر الرقمي والوصول' : lang === 'fr' ? '3. Fac-similé numérique & source d\'images' : '3. Digital Facsimile & Access'}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            {lang === 'ar' ? 'رابط للنسخة الرقمية (Gallica، بوابة الأرشيف، درايف، إلخ)' : lang === 'fr' ? 'Lien vers les scans en ligne (Gallica, portail bibliothèque, IIIF, Google Drive, Archive.org)' : 'Link to digitized scans (Gallica, library portal, IIIF, Drive, Archive.org)'}
                        </p>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                        {lang === 'ar' ? 'رابط النسخة الرقمية (URL)' : lang === 'fr' ? 'URL du fac-similé ou des scans' : 'Digital Facsimile URL'}
                    </label>
                    <input
                        type="url"
                        value={facsimileUrl}
                        onChange={(e) => setFacsimileUrl(e.target.value)}
                        placeholder="https://gallica.bnf.fr/... ou https://archive.org/..."
                        className="w-full h-11 px-3.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <p className="mt-1.5 text-xs text-muted-foreground">
                        {lang === 'ar' 
                            ? 'يمكن وضع رابط لمكتبة رقمية مفتوحة أو مجلد سحابي يضم صور الصفحات.'
                            : lang === 'fr'
                            ? 'Indiquez le lien vers la bibliothèque numérique, un manifeste IIIF ou un dossier partagé contenant les pages.'
                            : 'Provide a link to an open digital library, IIIF manifest, or shared archive containing the folios.'}
                    </p>
                </div>
            </div>

            {/* Section 4 : Informations sur le Proposant / Chercheur */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
                <div className="flex items-center gap-3 border-b border-border/60 pb-4 mb-6">
                    <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                        <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-heading font-semibold text-foreground">
                            {lang === 'ar' ? '٤. بيانات الباحث / الجهة المقترحة' : lang === 'fr' ? '4. Identification du chercheur ou institution' : '4. Proposer & Scholarly Affiliation'}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            {lang === 'ar' ? 'للتواصل الأكاديمي وإسناد المساهمة' : lang === 'fr' ? 'Pour le suivi scientifique et l\'attribution du témoin' : 'For academic correspondence and witness attribution'}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                            {lang === 'ar' ? 'الاسم الكامل *' : lang === 'fr' ? 'Nom et prénom *' : 'Full Name *'}
                        </label>
                        <input
                            type="text"
                            required
                            value={proposerName}
                            onChange={(e) => setProposerName(e.target.value)}
                            placeholder={lang === 'ar' ? 'د. فلان الفلاني' : lang === 'fr' ? 'Pr. ou Dr. Nom Prénom' : 'Prof. / Dr. Full Name'}
                            className="w-full h-11 px-3.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                            {lang === 'ar' ? 'البريد الإلكتروني المؤسسي *' : lang === 'fr' ? 'Email de contact *' : 'Academic / Contact Email *'}
                        </label>
                        <input
                            type="email"
                            required
                            value={proposerEmail}
                            onChange={(e) => setProposerEmail(e.target.value)}
                            placeholder="scholar@university.edu"
                            className="w-full h-11 px-3.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                            {lang === 'ar' ? 'المؤسسة أو الجامعة' : lang === 'fr' ? 'Affiliation académique' : 'University / Affiliation'}
                        </label>
                        <input
                            type="text"
                            value={proposerAffiliation}
                            onChange={(e) => setProposerAffiliation(e.target.value)}
                            placeholder={lang === 'ar' ? 'جامعة محمد الخامس / Sorbonne...' : lang === 'fr' ? 'ex. CNRS, EPHE, Sorbonne, Université Mohammed V...' : 'e.g. University / Research Center'}
                            className="w-full h-11 px-3.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>

                    <div className="md:col-span-3">
                        <label className="block text-sm font-semibold text-foreground mb-2">
                            {lang === 'ar' ? 'الأهمية العلمية والتحفيز' : lang === 'fr' ? 'Justification & intérêt scientifique du manuscrit' : 'Scholarly Justification & Research Rationale'}
                        </label>
                        <textarea
                            rows={3}
                            value={scholarlyJustification}
                            onChange={(e) => setScholarlyJustification(e.target.value)}
                            placeholder={lang === 'ar' 
                                ? 'لماذا يعد نسخ هذا الشاهد ذا قيمة للبحث؟ (ندرة النص، تنوع الخط، تعليقات حاشية، إلخ)'
                                : lang === 'fr'
                                ? 'En quoi ce manuscrit est-il précieux pour la recherche HTR ou l\'édition critique ? (Spécificités de l\'écriture, rareté de la copie, variantes de texte...)'
                                : 'Why is this witness valuable for HTR research or scholarly editing?'}
                            className="w-full p-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary leading-relaxed"
                        />
                    </div>
                </div>
            </div>

            {/* Bouton de soumission */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground text-center sm:text-left">
                    {lang === 'ar' 
                        ? 'تخضع المقترحات لمبادئ العلم المفتوح (Open Science) والأخلاقيات الأكاديمية.'
                        : lang === 'fr'
                        ? 'Les propositions s\'inscrivent dans une démarche de science ouverte et de valorisation patrimoniale.'
                        : 'Submissions adhere to Open Science principles and scholarly attribution standards.'}
                </p>
                <Button type="submit" disabled={submitting} size="lg" className="w-full sm:w-auto px-8 gap-2 font-semibold shadow-md">
                    {submitting ? (
                        <span>{lang === 'ar' ? 'جارٍ الإرسال...' : lang === 'fr' ? 'Transmission en cours...' : 'Submitting...'}</span>
                    ) : (
                        <>
                            <Send className="w-4 h-4" />
                            <span>{lang === 'ar' ? 'إرسال المقترح العلمي' : lang === 'fr' ? 'Transmettre la proposition' : 'Submit Proposal'}</span>
                        </>
                    )}
                </Button>
            </div>

        </form>
    )
}
