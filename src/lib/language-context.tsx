'use client'

import { createContext, useContext, useState, useEffect } from 'react'

export type Language = 'en' | 'fr' | 'ar'

type LanguageContextType = {
    lang: Language
    setLang: (l: Language) => void
    t: (key: string, vars?: Record<string, string | number>) => string
}

function setLanguageCookie(l: Language) {
    if (typeof document !== 'undefined') {
        document.cookie = `waraka_lang=${l}; path=/; max-age=31536000; SameSite=Lax`;
    }
}

export const translations: Record<string, Record<Language, string>> = {
    // Nav
    'nav.dashboard': { en: 'Dashboard', fr: 'Dashboard', ar: 'لوحة القيادة' },
    'nav.browse': { en: 'Browse Dataset', fr: 'Parcourir', ar: 'تصفح المخطوطات' },
    'nav.transcribe': { en: 'Transcribe', fr: 'Transcrire', ar: 'نسخ المخطوطات' },
    'nav.learn': { en: 'Learn to Read', fr: 'Apprendre à lire', ar: 'تعلم القراءة' },
    'nav.profile': { en: 'Profile', fr: 'Profil', ar: 'الملف الشخصي' },
    'nav.contributions': { en: 'My Contributions', fr: 'Mes contributions', ar: 'مساهماتي' },
    'nav.admin': { en: 'Admin Panel', fr: 'Panneau Admin', ar: 'لوحة الإدارة' },
    'nav.signout': { en: 'Sign out', fr: 'Se déconnecter', ar: 'تسجيل الخروج' },
    'nav.lang_toggle': { en: 'FR', fr: 'EN', ar: 'العربية' },

    // Onboarding
    'onboarding.title': { en: 'Welcome to Khatt-GPT', fr: 'Bienvenue sur Khatt-GPT', ar: 'مرحباً بكم في خط-GPT' },
    'onboarding.description': {
        en: "You're about to help preserve Maghrebi history. Here's a quick guide on how to contribute and transcribe Arabic manuscripts effectively.",
        fr: "Vous allez aider à préserver l'histoire maghrébine. Voici un guide rapide pour contribuer et transcrire des manuscrits arabes efficacement.",
        ar: "أنت على وشك المساعدة في الحفاظ على التاريخ المغربي. إليك دليلاً سريعاً حول كيفية المساهمة ونسخ المخطوطات العربية بفعالية."
    },
    'onboarding.step1.title': { en: '1. Read the Segment', fr: '1. Lire le segment', ar: '١. قراءة الجزء المظلل' },
    'onboarding.step1.desc': {
        en: "You will be presented with an image containing one or a few lines of a historical handwritten manuscript. Use the zoom and pan tools to inspect the ink closely.",
        fr: "Vous verrez une image contenant une ou quelques lignes d'un manuscrit historique. Utilisez le zoom et le déplacement pour examiner l'encre de près.",
        ar: "ستظهر لك صورة تحتوي على سطر أو بضعة أسطر من مخطوطة تاريخية مكتوبة بخط اليد. استخدم أدوات التكبير والتحريك لمعاينة الحبر بدقة."
    },
    'onboarding.step2.title': { en: '2. Type Exactly What You See', fr: '2. Tapez exactement ce que vous voyez', ar: '٢. اكتب ما تراه بدقة' },
    'onboarding.step2.desc': {
        en: "Transcribe character-by-character. No diacritics (vowels) are required — write exactly what you see. If you include them, it's not a problem, but focus on the letters.",
        fr: "Transcrivez caractère par caractère. Il ne faut pas de diacritiques (voyelles) — écrivez exactement ce que vous voyez. Si vous en mettez, ce n'est pas grave, mais privilégiez les lettres.",
        ar: "انسخ الحروف حرفاً بحرف. لا تشترط الحركات (التشكيل) — اكتب تماماً ما تراه. إذا أضفتها، فلا بأس، ولكن ركز على الحروف."
    },
    'onboarding.step3.title': { en: '3. Use "Open Panel" to Help You', fr: '3. Utilisez "Ouvrir le panneau" pour vous aider', ar: '٣. استخدم "فتح اللوحة" للمساعدة' },
    'onboarding.step3.desc': {
        en: 'The full manuscript image is displayed above. "Open Panel" gives you access to the printed book text where you can search for the phrase to understand the context — keep in mind that the handwritten manuscript may differ slightly from the printed version due to scribal variations.',
        fr: '"Ouvrir le panneau" vous donne accès au texte du livre imprimé (Référence) où vous pouvez rechercher la phrase pour comprendre le contexte — notez que le manuscrit peut différer légèrement de la version imprimée en raison des variations des copistes. (L\'image de la page entière est déjà intégrée à l\'écran).',
        ar: '"فتح اللوحة" يتيح لك الوصول إلى النص المطبوع للكتاب (المرجع) حيث يمكنك البحث عن العبارة لفهم السياق — تذكر أن المخطوطة اليدوية قد تختلف قليلاً عن النسخة المطبوعة بسبب اختلافات النسخ.'
    },
    'onboarding.step4.title': { en: '4. Level Up and Reach Consensus', fr: '4. Progressez et atteignez un consensus', ar: '٤. ارتق بمستواك وساعد في الوصول لإجماع' },
    'onboarding.step4.desc': {
        en: "Submit your transcription to earn points and achievements. Your work will be anonymously compared with other scholars to reach a consensus, building a verifiable scholarly dataset.",
        fr: "Soumettez votre transcription pour gagner des points. Votre travail sera comparé anonymement avec d'autres chercheurs pour atteindre un consensus, constituant un dataset savant vérifiable.",
        ar: "أرسل نسختك لكسب النقاط والإنجازات. ستتم مقارنة عملك بشكل مجهول مع باحثين آخرين للوصول إلى إجماع، مما يساهم في بناء قاعدة بيانات علمية موثقة."
    },
    'onboarding.start': { en: 'Start Transcribing', fr: 'Commencer la transcription', ar: 'ابدأ النسخ' },

    // Transcribe page
    'transcribe.session': { en: 'Session', fr: 'Session', ar: 'الجلسة' },
    'transcribe.segments': { en: 'segments', fr: 'segments', ar: 'أجزاء' },
    'transcribe.offline': { en: 'Offline Mode', fr: 'Mode hors ligne', ar: 'الوضع دون اتصال' },
    'transcribe.open_panel': { en: 'Open Panel', fr: 'Ouvrir le panneau', ar: 'فتح اللوحة' },
    'transcribe.close_panel': { en: 'Close Panel', fr: 'Fermer le panneau', ar: 'إغلاق اللوحة' },
    'transcribe.submit': { en: 'Submit Transcription', fr: 'Valider la transcription', ar: 'إرسال النسخ' },
    'transcribe.submitting': { en: 'Sending...', fr: 'Envoi...', ar: 'جاري الإرسال...' },
    'transcribe.save_edit': { en: 'Save Edit', fr: 'Sauvegarder', ar: 'حفظ التعديل' },
    'transcribe.cancel': { en: 'Cancel', fr: 'Annuler', ar: 'إلغاء' },
    'transcribe.skip': { en: 'Skip', fr: 'Passer', ar: 'تخطي' },
    'transcribe.keyboard': { en: 'Keyboard', fr: 'Clavier', ar: 'لوحة المفاتيح' },
    'transcribe.hide': { en: 'Hide', fr: 'Masquer', ar: 'إخفاء' },
    'transcribe.flag': { en: 'Flag as unreadable', fr: 'Signaler comme illisible', ar: 'الإبلاغ كغير مقروء' },
    'transcribe.non_arabic': { en: 'Note: Non-Arabic characters detected.', fr: 'Note : Caractères non arabes détectés.', ar: 'تنبيه: تم كشف حروف غير عربية.' },
    'transcribe.all_caught_up': { en: "You're all caught up!", fr: 'Vous avez tout transcrit !', ar: 'لقد أنهيت كل شيء!' },
    'transcribe.no_segments': { en: 'There are currently no more segments to transcribe. Come back later when new manuscripts are uploaded.', fr: 'Il n\'y a plus de segments à transcrire. Revenez plus tard lorsque de nouveaux manuscrits seront ajoutés.', ar: 'لا توجد حالياً أي أسطر أخرى للنسخ. يرجى العودة لاحقاً عند رفع مخطوطات جديدة.' },
    'transcribe.zoom_hint': { en: 'Scroll to zoom • Drag to pan', fr: 'Molette pour zoomer • Glisser pour déplacer', ar: 'عجلة الفأرة للتكبير • السحب للتحريك' },
    'transcribe.reset_zoom': { en: 'Reset', fr: 'Réinitialiser', ar: 'إعادة ضبط' },
    'transcribe.center_line': { en: 'Center on Line', fr: 'Centrer la ligne', ar: 'توسيط السطر' },
    'transcribe.instruction': { en: 'Transcribe only the highlighted line. (No diacritics required, but accepted).', fr: 'Transcrivez uniquement la ligne en surbrillance. (Sans voyelles de préférence, mais acceptées).', ar: 'انسخ السطر المظلل فقط. (لا تشترط الحركات، ولكنها تقبل).' },
    'transcribe.submit_hint': { en: 'to validate', fr: 'pour valider', ar: 'للإرسال' },
    'transcribe.placeholder': { en: 'Type text here...', fr: 'اكتب النص هنا...', ar: 'اكتب النص هنا...' },
    'transcribe.skip_title': { en: 'Skip to next', fr: 'Passer au suivant', ar: 'تخطي إلى التالي' },
    'transcribe.prev_title': { en: 'Previous segment', fr: 'Segment précédent', ar: 'السطر السابق' },
    'transcribe.auto_zoom': { en: 'Auto-zoom', fr: 'Auto-zoom', ar: 'تكبير تلقائي' },
    'transcribe.transcription_header': { en: 'Transcription', fr: 'Transcription', ar: 'النسخ المقترح' },
    'transcribe.navigation_title': { en: 'Manuscript Navigation', fr: 'Navigation Manuscrit', ar: 'تصفح المخطوطة' },
    'transcribe.navigation_desc': { en: 'Choose a page and a segment to transcribe.', fr: 'Choisissez une page et une ligne à transcrire.', ar: 'اختر صفحة وسطرًا لنسخه.' },
    'transcribe.open_navigation': { en: 'Navigate manuscript', fr: 'Naviguer dans le manuscrit', ar: 'تصفح المخطوطة' },
    'transcribe.close_navigation': { en: 'Hide navigation', fr: 'Masquer la navigation', ar: 'إخفاء التصفح' },
    'transcribe.zoom_line': { en: 'Zoom line', fr: 'Zoomer la ligne', ar: 'تكبير السطر' },
    'transcribe.reference_tab': { en: 'Reference', fr: 'Référence', ar: 'المرجع' },
    'transcribe.community_tab': { en: 'Suggestions', fr: 'Propositions', ar: 'اقتراحات' },
    'transcribe.reference_title': { en: 'Published text reference', fr: 'Texte publié de référence', ar: 'النص المنشور المرجعي' },
    'transcribe.reference_desc': { en: 'Search the uploaded .txt of the same book to find a likely passage and compare wording.', fr: 'Cherchez dans le .txt du même livre pour retrouver un passage probable et comparer le texte.', ar: 'ابحث في ملف .txt للكتاب نفسه للعثور على مقطع محتمل ومقارنة الصياغة.' },
    'transcribe.reference_open_search': { en: 'Open reference search', fr: 'Ouvrir la recherche de référence', ar: 'فتح البحث في المرجع' },
    'transcribe.reference_popup_desc': { en: 'Search the printed text while keeping the manuscript line visible on the left.', fr: 'Cherchez dans le texte imprimé en gardant la ligne du manuscrit visible à gauche.', ar: 'ابحث في النص المطبوع مع إبقاء سطر المخطوطة مرئيا على اليسار.' },
    'transcribe.reference_popup_hint_title': { en: 'Use the floating search panel', fr: 'Utilisez le panneau de recherche flottant', ar: 'استخدم لوحة البحث العائمة' },
    'transcribe.reference_popup_hint_desc': { en: 'Open the search panel to compare the published text without hiding the highlighted manuscript line.', fr: 'Ouvrez le panneau de recherche pour comparer le texte publié sans cacher la ligne surlignée du manuscrit.', ar: 'افتح لوحة البحث لمقارنة النص المنشور دون إخفاء السطر المحدد من المخطوطة.' },
    'transcribe.reference_close': { en: 'Close reference search', fr: 'Fermer la recherche de référence', ar: 'إغلاق البحث في المرجع' },
    'transcribe.reference_search_placeholder': { en: 'Search a word or phrase in the published text...', fr: 'Rechercher un mot ou une expression dans le texte publié...', ar: 'ابحث عن كلمة أو عبارة في النص المنشور...' },
    'transcribe.reference_ready': { en: 'Ready to search the reference text', fr: 'Prêt à chercher dans le texte de référence', ar: 'جاهز للبحث في النص المرجعي' },
    'transcribe.reference_matches': { en: '{count} matches', fr: '{count} correspondances', ar: '{count} نتيجة' },
    'transcribe.reference_prev': { en: 'Previous match', fr: 'Correspondance précédente', ar: 'النتيجة السابقة' },
    'transcribe.reference_next': { en: 'Next match', fr: 'Correspondance suivante', ar: 'النتيجة التالية' },
    'transcribe.reference_clear': { en: 'Clear search', fr: 'Effacer la recherche', ar: 'مسح البحث' },
    'transcribe.reference_no_matches': { en: 'No match found. Try a shorter word, a root, or a nearby phrase.', fr: 'Aucune correspondance. Essayez un mot plus court, une racine ou une expression voisine.', ar: 'لا توجد نتيجة. جرّب كلمة أقصر أو جذرا أو عبارة قريبة.' },
    'transcribe.reference_active_match': { en: 'Current match', fr: 'Correspondance active', ar: 'النتيجة الحالية' },
    'transcribe.reference_empty_title': { en: 'No reference text yet', fr: 'Aucun texte de référence', ar: 'لا يوجد نص مرجعي بعد' },
    'transcribe.reference_empty_desc': { en: 'From the admin area, attach a .txt of the printed or published version of this same book so contributors can search it while transcribing.', fr: 'Depuis l’admin, ajoutez un .txt de la version imprimée ou publiée du même livre afin que les contributeurs puissent y chercher pendant la transcription.', ar: 'من لوحة الإدارة، أضف ملف .txt للنسخة المطبوعة أو المنشورة من الكتاب نفسه حتى يتمكن المساهمون من البحث فيه أثناء النسخ.' },
    'transcribe.segmentation_report_button': { en: 'Report a segmentation problem', fr: 'Notifier un problème de segmentation', ar: 'الإبلاغ عن مشكلة في تقطيع السطر' },
    'transcribe.segmentation_reported_button': { en: 'Segmentation problem reported', fr: 'Problème de segmentation notifié', ar: 'تم الإبلاغ عن مشكلة التقطيع' },
    'transcribe.segmentation_report_title': { en: 'Tell admins this line crop or polygon needs review.', fr: 'Prévenir les admins que le découpage ou le polygone de cette ligne doit être revu.', ar: 'إبلاغ الإدارة أن قص هذا السطر أو حدوده يحتاج إلى مراجعة.' },
    'transcribe.segmentation_reported_title': { en: 'Segmentation issue reported', fr: 'Problème de segmentation notifié', ar: 'تم الإبلاغ عن مشكلة التقطيع' },
    'transcribe.segmentation_reported_desc': { en: 'Admins will be able to find this segment during review.', fr: 'Les admins pourront retrouver ce segment lors de la vérification.', ar: 'سيتمكن المشرفون من العثور على هذا السطر أثناء المراجعة.' },
    'transcribe.segmentation_report_error': { en: 'Unable to report segmentation issue', fr: 'Impossible de notifier le problème de segmentation', ar: 'تعذر الإبلاغ عن مشكلة التقطيع' },
    'transcribe.segmentation_confirm_title': { en: 'Report this segmentation?', fr: 'Notifier ce problème de segmentation ?', ar: 'هل تريد الإبلاغ عن مشكلة التقطيع؟' },
    'transcribe.segmentation_confirm_desc': { en: 'Use this only when the crop or polygon does not match the line to transcribe. An admin will review it later.', fr: 'À utiliser seulement si le découpage ou le polygone ne correspond pas à la ligne à transcrire. Un admin le vérifiera ensuite.', ar: 'استخدم هذا فقط إذا كان القص أو حدود السطر لا تطابق السطر المطلوب نسخه. سيراجعه مشرف لاحقا.' },
    'transcribe.segmentation_confirm_action': { en: 'Confirm report', fr: 'Confirmer le signalement', ar: 'تأكيد الإبلاغ' },
    'transcribe.loading': { en: 'Loading...', fr: 'Chargement...', ar: 'جاري التحميل...' },

    // Browse page
    'browse.title': { en: 'Segment Browser', fr: 'Explorateur de segments', ar: 'متصفح الأسطر' },
    'browse.desc': { en: 'Explore the growing dataset of validated manuscript segments. These transcriptions have reached consensus and are considered definitive.', fr: 'Explorez le dataset croissant de segments de manuscrits validés. Ces transcriptions ont atteint un consensus et sont considérées comme définitives.', ar: 'استكشف قاعدة البيانات المتنامية للأسطر الموثقة. هذه النصوص وصلت إلى إجماع علمي وتعتبر نهائية.' },
    'browse.search': { en: 'Search transcriptions...', fr: 'Rechercher des transcriptions...', ar: 'البحث في النصوص المنسوخة...' },
    'browse.no_segments': { en: 'No segments found', fr: 'Aucun segment trouvé', ar: 'لم يتم العثور على أسطر' },
    'browse.no_segments_desc': { en: 'There are no validated segments yet. Start transcribing to build the dataset!', fr: 'Aucun segment validé pour le moment. Commencez à transcrire !', ar: 'لا توجد أسطر موثقة بعد. ابدأ النسخ لبناء قاعدة البيانات!' },
    'browse.go_transcribe': { en: 'Go to Transcription', fr: 'Aller à la transcription', ar: 'الانتقال إلى لوحة النسخ' },
    'browse.contribute': { en: 'Contribute more', fr: 'Contribuer davantage', ar: 'المساهمة بالمزيد' },

    // Learn page
    'learn.title': { en: 'Learn to Read Manuscripts', fr: 'Apprendre à lire les manuscrits', ar: 'تعلم قراءة المخطوطات' },
    'learn.desc': { en: 'Browse transcribed lines to train your eye. Each line shows the manuscript image alongside its transcription.', fr: 'Parcourez les lignes transcrites pour entraîner votre regard. Chaque ligne montre l\'image du manuscrit avec sa transcription.', ar: 'تصفح الأسطر المنسوخة لتدريب عينيك. يعرض كل سطر صورة المخطوطة إلى جانب النص المنسوخ.' },
    'learn.validated': { en: 'Validated by admin', fr: 'Validé par un admin', ar: 'موثق من الإدارة' },
    'learn.in_progress': { en: 'In progress', fr: 'En cours', ar: 'قيد المراجعة' },
    'learn.unvalidated': { en: 'The text below is preliminary and has not yet been formally validated. CLICK to reveal!', fr: 'Le texte ci-dessous est préliminaire et n\'a pas encore été formellement validé. CLIQUER pour révéler !', ar: 'النص أدناه أولي ولم يتم توثيقه رسمياً بعد. اضغط لإظهاره!' },
    'learn.no_segments': { en: 'No transcribed segments available yet.', fr: 'Aucun segment transcrit disponible pour le moment.', ar: 'لا توجد أسطر منسوخة متاحة بعد.' },
    'learn.search': { en: 'Search...', fr: 'Rechercher...', ar: 'البحث...' },
    'nav.source': { en: 'Source', fr: 'Source', ar: 'المصدر' },
    'nav.guide': { en: 'Calligraphy Guide', fr: 'Guide Calligraphie', ar: 'دليل الخط المغربي' },

    // Guide page
    'guide.title': { en: 'Maghrebi Calligraphy Guide', fr: 'Guide de la Calligraphie Maghrébine', ar: 'دليل الخط المغربي القديم' },
    'guide.desc': {
        en: 'Maghrebi script is one of the oldest and most beautiful Arabic styles. Understanding its unique characteristics is essential for accurate transcription.',
        fr: 'L\'écriture maghrébine est l\'un des styles arabes les plus anciens et les plus beaux. Comprendre ses caractéristiques uniques est essentiel pour une transcription précise.',
        ar: 'يعد الخط المغربي أحد أقدم وأجمل الأساليب العربية. فهم خصائصه الفريدة أمر ضروري لنسخ دقيق.'
    },
    'guide.dots.title': { en: 'The Dotting System', fr: 'Le système de points', ar: 'نظام التنقيط المغربي' },
    'guide.dots.desc': {
        en: 'The Maghrebi system (inherited from Kufi) differs from the Eastern system (Mashreqi) in several ways:',
        fr: 'Le système maghrébin (hérité du Kufi) diffère du système oriental (Mashreqi) sur plusieurs points :',
        ar: 'يختلف النظام المغربي (الموروث من الكوفي) عن النظام المشرقي في عدة جوانب:'
    },
    'guide.fa.title': { en: 'The letter Faa (ڢ)', fr: 'La lettre Faa (ڢ)', ar: 'حرف الفاء (ڢ)' },
    'guide.fa.desc': {
        en: 'In Maghrebi script, the Faa has its single dot BELOW the circle, unlike the Eastern system.',
        fr: 'Dans le système maghrébin, le Faa a son point unique EN DESSOUS de la boucle, contrairement au système oriental.',
        ar: 'في الخط المغربي، توضع نقطة الفاء المفردة أسفل الدائرة، على عكس النظام المشرقي.'
    },
    'guide.qaf.title': { en: 'The letter Qaf (ڧ)', fr: 'La lettre Qaf (ڧ)', ar: 'حرف القاف (ڧ)' },
    'guide.qaf.desc': {
        en: 'The Maghrebi Qaf has only ONE dot ABOVE (resembling a standard Faa). Double dots are rare.',
        fr: 'Le Qaf maghrébin n\'a qu\'UN SEUL point AU-DESSUS (ressemblant à un Faa standard). Les deux points sont rares.',
        ar: 'يحتوي القاف المغربي على نقطة واحدة فقط فوق الحرف (يشبه الفاء المشرقية). النقطتان نادرتان.'
    },
    'guide.nun.title': { en: 'Omitted Dots (Nun, etc.)', fr: 'Points omis (Nun, etc.)', ar: 'حذف النقط (النون وغيرها)' },
    'guide.nun.desc': {
        en: 'In final or isolated positions, the Nun, Qaf, and other letters often have NO point. The shape alone identifies them.',
        fr: 'En position finale ou isolée, le Nun, le Qaf et d\'autres lettres n\'ont souvent AUCUN point. La forme seule suffit à les identifier.',
        ar: 'في نهاية الكلمة أو منفصلة، غالباً ما تكون النون والقاف والحروف الأخرى بدون نقط. شكل الحرف وحده كافٍ لتحديده.'
    },
    'guide.styles.title': { en: 'Calligraphic Styles', fr: 'Styles Calligraphiques', ar: 'الأنماط الخطية' },
    'guide.styles.mabsut': {
        en: 'Mabsut is a ceremonial and clear script used for main texts and fine Qurans. It features readable, regular curves and dynamic horizontal extension.',
        fr: 'Le Mabsut est un style cérémoniel et clair utilisé pour les textes principaux et les beaux Corans. Il se caractérise par des courbes régulières et une extension dynamique.',
        ar: 'الخط المبسوط هو خط رسمي وواضح يستخدم للنصوص الرئيسية والمصاحف الشريفة. يتميز بمنحنيات منتظمة وامتدادات أفقية واضحة.'
    },
    'guide.styles.mujawhar': {
        en: 'Mujawhar ("Jeweled") is a cursive and dense Maghrebi script preferred for administrative documents, scientific books, and official correspondence.',
        fr: 'Le Mujawhar ("Bijou") est un style maghrébin cursif et dense, favorisé pour les documents administratifs, les ouvrages scientifiques et la correspondance officielle.',
        ar: 'الخط المجوهر هو خط متصل ومكتنز، يفضل في الوثائق الإدارية والكتب العلمية والمراسلات الرسمية.'
    },
    'guide.styles.thuluth': {
        en: 'Thuluth Maghrebi is a majestic, large ornamental script used for chapter headings, architectural inscriptions, and noble titles.',
        fr: 'Le Thuluth Maghrébin est une écriture majestueuse et ornementale de grande taille, utilisée pour les titres de chapitres, l\'architecture et les titres de noblesse.',
        ar: 'الثلث المغربي هو خط زخرفي مهيب كبير الحجم، يستخدم لعناوين الفصول والنقوش المعمارية والألقاب الشريفة.'
    },
    'guide.styles.koufi': {
        en: 'Maghrebi Kufic is the angular ancestor of Western styles, often incorporating unique curves. It was foundational for early Quranic manuscripts.',
        fr: 'Le Koufi Maghrébin est l\'ancêtre angulaire des styles occidentaux, intégrant des courbes uniques. Il fut le socle des premiers manuscrits coraniques.',
        ar: 'الكوفي المغربي هو السلف الهندسي للخطوط الغربية، وغالباً ما يدمج منحنيات فريدة. كان أساسياً للمخطوطات القرآنية المبكرة.'
    },
    'guide.styles.musnad': {
        en: 'Musnad is an ancient South Arabian monumental script, a geometric precursor to Arabic styles, though historically distinct from Maghrebi scripts.',
        fr: 'Le Musnad est une écriture monumentale antique de l\'Arabie du Sud, précurseur géométrique des styles arabes, bien que distinct du Maghrébin classique.',
        ar: 'خط المسند هو خط نصب قديم من جنوب الجزيرة العربية، وهو سلف هندسي للأنماط العربية، على الرغم من تميزه تاريخياً عن الخطوط المغربية.'
    },

    // Dashboard translations
    'dashboard.resume': { en: 'Resume Transcription', fr: 'Reprendre la transcription', ar: 'استئناف نسخ المخطوطات' },
    'dashboard.pending_desc': { en: 'There are currently {count} segments waiting to be transcribed.', fr: 'Il y a actuellement {count} segments en attente de transcription.', ar: 'يوجد حالياً {count} أسطر في انتظار نسخها.' },
    'dashboard.start_button': { en: 'Start Transcribing', fr: 'Commencer à transcrire', ar: 'ابدأ النسخ الآن' },
    'dashboard.recent_contributions': { en: 'Recent Contributions', fr: 'Contributions Récentes', ar: 'أحدث المساهمات' },
    'dashboard.top_scholars': { en: 'Top Scholars', fr: 'Meilleurs Chercheurs', ar: 'أفضل المساهمين' },
    'dashboard.no_contributions': { en: "You haven't contributed yet.", fr: "Vous n'avez pas encore contribué.", ar: 'لم تقم بأي مساهمة بعد.' },
    'dashboard.setting_up': { en: 'Setting up your profile...', fr: 'Configuration de votre profil...', ar: 'جاري إعداد ملفك الشخصي...' },
    'dashboard.setting_up_desc': { en: 'This usually takes a few seconds after signing up.', fr: 'Cela prend généralement quelques secondes après l\'inscription.', ar: 'يستغرق هذا عادةً بضع ثوانٍ بعد التسجيل.' },
    'dashboard.refresh': { en: 'Refresh Page', fr: 'Actualiser la page', ar: 'تحديث الصفحة' },
    'dashboard.streak_days': { en: 'days', fr: 'jours', ar: 'أيام' },

    // Profile translations
    'profile.title': { en: 'Profile & Progress', fr: 'Profil et progression', ar: 'الملف الشخصي والتقدم' },
    'profile.username': { en: 'Public Username', fr: 'Nom d\'utilisateur public', ar: 'اسم المستخدم العام' },
    'profile.display_name': { en: 'Display Name', fr: 'Nom affiché', ar: 'الاسم المعروض' },
    'profile.edit': { en: 'Edit', fr: 'Modifier', ar: 'تعديل' },
    'profile.cancel': { en: 'Cancel', fr: 'Annuler', ar: 'إلغاء' },
    'profile.level': { en: 'Level', fr: 'Niveau', ar: 'المستوى' },
    'profile.xp_needed': { en: 'XP to next level.', fr: 'XP vers le niveau suivant.', ar: 'نقطة للمستوى التالي.' },
    'profile.max_level': { en: 'Max level reached.', fr: 'Niveau max atteint.', ar: 'تم الوصول للحد الأقصى للمستوى.' },
    'profile.lines': { en: 'Lines', fr: 'Lignes', ar: 'الأسطر' },
    'profile.streak': { en: 'Streak', fr: 'Série', ar: 'سلسلة الأيام' },
    'profile.boosts_title': { en: 'Active Boosts', fr: 'Boosts actifs', ar: 'المضاعفات النشطة' },
    'profile.no_boosts': { en: 'No active boosts at the moment.', fr: 'Aucun boost actif pour le moment.', ar: 'لا توجد مضاعفات نشطة حالياً.' },
    'profile.next_goal': { en: 'Next Goal', fr: 'Prochain objectif', ar: 'الهدف القادم' },
    'profile.all_badges_unlocked': { en: 'All available badges unlocked.', fr: 'Tous les badges disponibles sont débloqués.', ar: 'تم إلغاء قفل جميع الشارات المتاحة.' },
    'profile.unlocked_badges': { en: 'Unlocked Badges', fr: 'Badges débloqués', ar: 'الشارات المفتوحة' },
    'profile.boosts_badges_desc': { en: 'Double XP, milestones, locked badges, and live progress.', fr: 'Double XP, paliers, badges verrouillés et progression en direct.', ar: 'مضاعفة النقاط، المعالم، الشارات المقفلة، ومتابعة التقدم المباشر.' },
    'profile.history': { en: 'Transcription History', fr: 'Historique des transcriptions', ar: 'سجل النسخ' },
    'profile.no_history': { en: "You haven't made any transcriptions yet.", fr: "Vous n'avez pas encore fait de transcriptions.", ar: 'لم تقم بأي نسخ للمخطوطات بعد.' },
    'profile.table_segment': { en: 'Segment', fr: 'Segment', ar: 'السطر' },
    'profile.table_text': { en: 'Text', fr: 'Texte', ar: 'النص المنسوخ' },
    'profile.table_date': { en: 'Date', fr: 'Date', ar: 'التاريخ' },
    'profile.table_status': { en: 'Status', fr: 'Statut', ar: 'الحالة' },
    'profile.table_actions': { en: 'Actions', fr: 'Actions', ar: 'الإجراءات' },
    'profile.status_validated': { en: 'Validated', fr: 'Validé', ar: 'مقبول' },
    'profile.status_pending': { en: 'Pending', fr: 'En attente', ar: 'قيد الانتظار' },
    'profile.delete_confirm': { en: 'Are you sure you want to delete this transcription?', fr: 'Êtes-vous sûr de vouloir supprimer cette transcription ?', ar: 'هل أنت متأكد من حذف هذا النسخ؟' }
}

function interpolate(value: string, vars?: Record<string, string | number>) {
    if (!vars) return value
    return Object.entries(vars).reduce(
        (text, [name, replacement]) => text.replaceAll(`{${name}}`, String(replacement)),
        value
    )
}

export function translate(key: string, lang: Language, vars?: Record<string, string | number>): string {
    return interpolate(translations[key]?.[lang] ?? translations[key]?.en ?? key, vars)
}

const LanguageContext = createContext<LanguageContextType>({
    lang: 'fr',
    setLang: () => { },
    t: (key, vars) => translate(key, 'fr', vars),
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [lang, setLangState] = useState<Language>('fr')

    useEffect(() => {
        const saved = localStorage.getItem('waraka_lang') as Language | null
        if (saved === 'en' || saved === 'fr' || saved === 'ar') {
            setLangState(saved)
            setLanguageCookie(saved)
            if (typeof document !== 'undefined') {
                document.documentElement.lang = saved
                document.documentElement.dir = saved === 'ar' ? 'rtl' : 'ltr'
            }
        } else {
            const defaultLang = 'fr'
            setLangState(defaultLang)
            setLanguageCookie(defaultLang)
            if (typeof document !== 'undefined') {
                document.documentElement.lang = defaultLang
                document.documentElement.dir = 'ltr'
            }
        }
    }, [])

    const setLang = (l: Language) => {
        setLangState(l)
        localStorage.setItem('waraka_lang', l)
        setLanguageCookie(l)
        if (typeof document !== 'undefined') {
            document.documentElement.lang = l
            document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr'
        }
    }

    const t = (key: string, vars?: Record<string, string | number>): string => {
        return translate(key, lang, vars)
    }

    return (
        <LanguageContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LanguageContext.Provider>
    )
}

export const useLanguage = () => useContext(LanguageContext)
