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
    'nav.corpus': { en: 'Corpus', fr: 'Corpus', ar: 'المجموعة' },
    'nav.research': { en: 'Research', fr: 'Recherche', ar: 'البحث' },
    'nav.methodology': { en: 'Methodology', fr: 'Méthodologie', ar: 'المنهجية' },
    'nav.propose': { en: 'Suggest', fr: 'Proposer', ar: 'اقتراح مخطوط' },
    'nav.transcribe': { en: 'Transcribe', fr: 'Transcrire', ar: 'نسخ المخطوطات' },
    'nav.learn': { en: 'Learn to Read', fr: 'Apprendre à lire', ar: 'تعلم القراءة' },
    'nav.profile': { en: 'Profile', fr: 'Profil', ar: 'الملف الشخصي' },
    'nav.contributions': { en: 'My Contributions', fr: 'Mes contributions', ar: 'مساهماتي' },
    'nav.admin': { en: 'Admin Panel', fr: 'Panneau Admin', ar: 'لوحة الإدارة' },
    'nav.signout': { en: 'Sign out', fr: 'Se déconnecter', ar: 'تسجيل الخروج' },
    'nav.lang_toggle': { en: 'FR', fr: 'EN', ar: 'العربية' },
    'nav.random': { en: 'Random line', fr: 'Ligne aléatoire', ar: 'سطر عشوائي' },
    'nav.choose_manuscript': { en: 'Choose a manuscript', fr: 'Choisir un manuscrit', ar: 'اختيار مخطوطة' },
    'nav.main': { en: 'Main navigation', fr: 'Navigation principale', ar: 'التنقل الرئيسي' },
    'common.language': { en: 'Language', fr: 'Langue', ar: 'اللغة' },
    'common.menu': { en: 'Menu', fr: 'Menu', ar: 'القائمة' },

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
    'transcribe.transcription_of': { en: 'Transcription by', fr: 'Transcription de', ar: 'نسخ بواسطة' },
    'transcribe.page_context': { en: 'Page context', fr: 'Contexte de la page', ar: 'سياق الصفحة' },
    'transcribe.pdf_tab': { en: 'PDF', fr: 'PDF', ar: 'PDF' },
    'transcribe.full_page_alt': { en: 'Full page context', fr: 'Contexte de la page entière', ar: 'سياق الصفحة الكاملة' },
    'transcribe.navigation_title': { en: 'Manuscript Navigation', fr: 'Navigation Manuscrit', ar: 'تصفح المخطوطة' },
    'transcribe.navigation_desc': { en: 'Choose a page and a segment to transcribe.', fr: 'Choisissez une page et une ligne à transcrire.', ar: 'اختر صفحة وسطرًا لنسخه.' },
    'transcribe.pages': { en: 'Pages', fr: 'Pages', ar: 'الصفحات' },
    'transcribe.lines': { en: 'Lines', fr: 'Lignes', ar: 'الأسطر' },
    'transcribe.select_page': { en: 'Select a page', fr: 'Sélectionnez une page', ar: 'اختر صفحة' },
    'transcribe.line': { en: 'Line', fr: 'Ligne', ar: 'السطر' },
    'transcribe.done': { en: 'Done', fr: 'Fait', ar: 'تم' },
    'transcribe.validated_short': { en: 'Validated', fr: 'Validé', ar: 'موثق' },
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
    'transcribe.locked_submitted': { en: 'You have already submitted a transcription for this line. It is shown here for reference and cannot be submitted again.', fr: 'Vous avez déjà soumis une transcription pour cette ligne. Elle est affichée ici pour consultation et ne peut pas être soumise une seconde fois.', ar: 'لقد أرسلت نسخا لهذا السطر من قبل. يظهر هنا للمراجعة ولا يمكن إرساله مرة أخرى.' },
    'transcribe.locked_validated': { en: 'This line has already been validated. The accepted transcription is shown here and can no longer be edited.', fr: 'Cette ligne a déjà été validée. La transcription retenue est affichée ici et ne peut plus être modifiée.', ar: 'تم توثيق هذا السطر بالفعل. يظهر النص المعتمد هنا ولا يمكن تعديله.' },
    'transcribe.loading': { en: 'Loading...', fr: 'Chargement...', ar: 'جاري التحميل...' },
    'transcribe.online_syncing': { en: 'Back online. Syncing transcriptions...', fr: 'Connexion rétablie. Synchronisation des transcriptions...', ar: 'عاد الاتصال. جارٍ مزامنة النسخ...' },
    'transcribe.offline_synced': { en: 'Offline transcriptions synced', fr: 'Transcriptions hors ligne synchronisées', ar: 'تمت مزامنة النسخ المحفوظة دون اتصال' },
    'transcribe.offline_synced_desc': { en: '{count} transcription(s) synced successfully.', fr: '{count} transcription(s) synchronisée(s).', ar: 'تمت مزامنة {count} من النسخ بنجاح.' },
    'transcribe.offline_sync_failed': { en: '{count} item(s) could not be synced and remain saved on this device.', fr: '{count} élément(s) n’ont pas pu être synchronisé(s) et restent enregistrés sur cet appareil.', ar: 'تعذر مزامنة {count} عنصر وستبقى محفوظة على هذا الجهاز.' },
    'transcribe.offline_saved': { en: 'Saved on this device. It will sync when the connection returns.', fr: 'Enregistrée sur cet appareil. Elle sera synchronisée au retour de la connexion.', ar: 'حُفظت على هذا الجهاز وستتم مزامنتها عند عودة الاتصال.' },
    'transcribe.updated_desc': { en: 'Transcription updated.', fr: 'Transcription mise à jour.', ar: 'تم تحديث النسخ.' },
    'transcribe.boosts_active': { en: 'Boosts: {boosts}', fr: 'Boosts : {boosts}', ar: 'المضاعفات: {boosts}' },
    'transcribe.streak_hint': { en: 'Keep your streak active to unlock XP multipliers.', fr: 'Maintenez votre série pour débloquer des multiplicateurs d’XP.', ar: 'حافظ على سلسلتك لفتح مضاعفات النقاط.' },
    'transcribe.badge_unlocked': { en: 'Badge unlocked', fr: 'Badge débloqué', ar: 'تم فتح الشارة' },
    'transcribe.badge_unlocked_desc': { en: 'New badge unlocked.', fr: 'Nouveau badge débloqué.', ar: 'تم فتح شارة جديدة.' },
    'transcribe.load_segment_error': { en: 'Unable to load the segment.', fr: 'Impossible de charger le segment.', ar: 'تعذر تحميل السطر.' },
    'transcribe.flagged_title': { en: 'Segment flagged', fr: 'Segment signalé', ar: 'تم الإبلاغ عن السطر' },
    'transcribe.flagged_desc': { en: 'An administrator will review this segment.', fr: 'Un administrateur vérifiera ce segment.', ar: 'سيراجع أحد المشرفين هذا السطر.' },
    'common.error': { en: 'Error', fr: 'Erreur', ar: 'خطأ' },
    'common.updated': { en: 'Updated', fr: 'Mis à jour', ar: 'تم التحديث' },
    'common.close_notification': { en: 'Close notification', fr: 'Fermer la notification', ar: 'إغلاق الإشعار' },
    'admin.proposals': { en: 'Proposals', fr: 'Propositions', ar: 'المقترحات' },
    'admin.analytics_title': { en: 'Analytics hub', fr: 'Centre analytique', ar: 'لوحة التحليلات' },
    'admin.refresh_data': { en: 'Refresh data', fr: 'Actualiser les données', ar: 'تحديث البيانات' },
    'admin.transcription_activity': { en: 'Transcription activity', fr: 'Activité de transcription', ar: 'نشاط النسخ' },
    'admin.total_submissions': { en: 'Total submissions', fr: 'Total des soumissions', ar: 'إجمالي الإرسالات' },
    'admin.segment_pipeline': { en: 'Segment status pipeline', fr: 'État des segments', ar: 'حالة الأسطر' },
    'admin.top_points': { en: 'Top contributors (points)', fr: 'Meilleurs contributeurs (points)', ar: 'أفضل المساهمين (النقاط)' },
    'admin.status_pending': { en: 'Pending', fr: 'En attente', ar: 'قيد الانتظار' },
    'admin.status_validated': { en: 'Validated', fr: 'Validé', ar: 'موثق' },
    'admin.status_conflict': { en: 'Conflict / flagged', fr: 'Conflit / signalé', ar: 'تعارض / مبلغ عنه' },
    'admin.points': { en: 'Points', fr: 'Points', ar: 'النقاط' },
    'admin.search_users': { en: 'Search users...', fr: 'Rechercher des utilisateurs...', ar: 'البحث عن المستخدمين...' },
    'admin.email': { en: 'Email', fr: 'E-mail', ar: 'البريد الإلكتروني' },
    'admin.status': { en: 'Status', fr: 'Statut', ar: 'الحالة' },
    'admin.actions_menu': { en: 'Actions', fr: 'Actions', ar: 'الإجراءات' },
    'admin.active': { en: 'Active', fr: 'Actif', ar: 'نشط' },
    'admin.edit': { en: 'Edit', fr: 'Modifier', ar: 'تعديل' },
    'admin.unknown': { en: 'Unknown', fr: 'Inconnu', ar: 'غير معروف' },
    'admin.unknown_manuscript': { en: 'Unknown manuscript', fr: 'Manuscrit inconnu', ar: 'مخطوطة غير معروفة' },
    'admin.suspended': { en: 'Suspended', fr: 'Suspendu', ar: 'موقوف' },
    'admin.no_users': { en: 'No users found.', fr: 'Aucun utilisateur trouvé.', ar: 'لم يتم العثور على مستخدمين.' },
    'admin.copy_user_id': { en: 'Copy user ID', fr: 'Copier l’identifiant', ar: 'نسخ معرّف المستخدم' },
    'admin.reactivate': { en: 'Reactivate', fr: 'Réactiver', ar: 'إعادة التفعيل' },
    'admin.suspend': { en: 'Suspend', fr: 'Suspendre', ar: 'إيقاف' },
    'admin.user_reactivated': { en: 'User reactivated', fr: 'Utilisateur réactivé', ar: 'تمت إعادة تفعيل المستخدم' },
    'admin.user_suspended': { en: 'User suspended', fr: 'Utilisateur suspendu', ar: 'تم إيقاف المستخدم' },
    'admin.user_access_updated': { en: 'Access for @{username} was updated.', fr: 'L’accès de @{username} a été mis à jour.', ar: 'تم تحديث وصول @{username}.' },
    'admin.suspend_confirm': { en: 'Do you really want to {action} this user?', fr: 'Voulez-vous vraiment {action} cet utilisateur ?', ar: 'هل تريد فعلاً {action} هذا المستخدم؟' },
    'admin.reactivate_action': { en: 'reactivate', fr: 'réactiver', ar: 'إعادة تفعيل' },
    'admin.suspend_action': { en: 'suspend', fr: 'suspendre', ar: 'إيقاف' },
    'admin.invalid_file': { en: 'Invalid file type', fr: 'Type de fichier invalide', ar: 'نوع الملف غير صالح' },
    'admin.reference_file_hint': { en: 'Upload the edited .txt or .md version of this book to help contributors.', fr: 'Ajoutez la version .txt ou .md publiée de ce livre pour aider les contributeurs.', ar: 'أضف النسخة المنشورة بصيغة .txt أو .md لمساعدة المساهمين.' },
    'admin.reference_text': { en: 'Reference text', fr: 'Texte de référence', ar: 'النص المرجعي' },
    'admin.reference_updated': { en: 'Reference text updated', fr: 'Texte de référence mis à jour', ar: 'تم تحديث النص المرجعي' },
    'admin.upload_reference': { en: 'Upload reference text', fr: 'Télécharger le texte de référence', ar: 'رفع النص المرجعي' },
    'admin.uploading': { en: 'Uploading...', fr: 'Téléchargement...', ar: 'جار الرفع...' },
    'admin.change': { en: 'Change', fr: 'Changer', ar: 'تغيير' },
    'admin.reference_uploaded': { en: 'Reference text uploaded', fr: 'Texte de référence téléchargé', ar: 'تم رفع النص المرجعي' },
    'admin.pdf_title': { en: 'Book PDF', fr: 'Livre PDF', ar: 'ملف PDF للكتاب' },
    'admin.pdf_hint': { en: 'Add the complete PDF version so contributors can consult it.', fr: 'Ajoutez la version PDF complète pour permettre aux contributeurs de la consulter.', ar: 'أضف نسخة PDF الكاملة ليتمكن المساهمون من الاطلاع عليها.' },
    'admin.download_pdf': { en: 'Download PDF', fr: 'Télécharger le PDF', ar: 'تحميل PDF' },
    'admin.pdf_updated': { en: 'PDF updated', fr: 'PDF mis à jour', ar: 'تم تحديث PDF' },
    'admin.upload_failed': { en: 'Upload failed', fr: 'Échec du téléchargement', ar: 'فشل الرفع' },
    'admin.title_required': { en: 'Title required', fr: 'Titre requis', ar: 'العنوان مطلوب' },
    'admin.book_needs_title': { en: 'The book must have a title.', fr: 'Le livre doit avoir un titre.', ar: 'يجب أن يحمل الكتاب عنواناً.' },
    'admin.book_updated': { en: 'Book updated', fr: 'Livre mis à jour', ar: 'تم تحديث الكتاب' },
    'admin.metadata_saved': { en: 'Metadata saved.', fr: 'Les métadonnées ont été enregistrées.', ar: 'تم حفظ البيانات الوصفية.' },
    'admin.delete_book_confirm': { en: 'Delete this book, all its pages and lines? This cannot be undone.', fr: 'Supprimer ce livre, toutes ses pages et toutes ses lignes ? Cette action est irréversible.', ar: 'هل تريد حذف هذا الكتاب وكل صفحاته وأسطره؟ لا يمكن التراجع عن هذا الإجراء.' },
    'admin.book_deleted': { en: 'Book deleted', fr: 'Livre supprimé', ar: 'تم حذف الكتاب' },
    'admin.edit_metadata': { en: 'Edit metadata', fr: 'Modifier les métadonnées', ar: 'تعديل البيانات الوصفية' },
    'admin.delete_book': { en: 'Delete book', fr: 'Supprimer le livre', ar: 'حذف الكتاب' },
    'admin.edit_book': { en: 'Edit book', fr: 'Modifier le livre', ar: 'تعديل الكتاب' },
    'admin.metadata_help': { en: 'This information helps contributors and reviewers understand the corpus.', fr: 'Ces informations aident les contributeurs et les vérificateurs à comprendre le corpus.', ar: 'تساعد هذه المعلومات المساهمين والمراجعين على فهم المجموعة.' },
    'admin.source_collection': { en: 'Source / collection', fr: 'Source / collection', ar: 'المصدر / المجموعة' },
    'admin.source_placeholder': { en: 'Library, collection, shelfmark...', fr: 'Bibliothèque, collection, cote...', ar: 'المكتبة، المجموعة، رقم الحفظ...' },
    'admin.description': { en: 'Description', fr: 'Description', ar: 'الوصف' },
    'admin.description_placeholder': { en: 'Context, folios, script, transcription notes...', fr: 'Contexte, folios, type d’écriture, consignes de transcription...', ar: 'السياق، الأوراق، نوع الخط، تعليمات النسخ...' },
    'admin.save': { en: 'Save', fr: 'Enregistrer', ar: 'حفظ' },
    'admin.bulk_upload': { en: 'Bulk add pages (ZIP)', fr: 'Ajouter des pages en lot (ZIP)', ar: 'إضافة صفحات دفعة واحدة (ZIP)' },
    'admin.bulk_title': { en: 'Bulk upload pages', fr: 'Import de pages en lot', ar: 'رفع الصفحات دفعة واحدة' },
    'admin.bulk_desc': { en: 'Select a ZIP containing page images. They will be added in alphabetical order.', fr: 'Sélectionnez un ZIP contenant les images des pages. Elles seront ajoutées dans l’ordre alphabétique.', ar: 'اختر ملف ZIP يحتوي على صور الصفحات. ستُضاف حسب الترتيب الأبجدي.' },
    'admin.select_zip': { en: 'Click to select a ZIP file', fr: 'Cliquez pour sélectionner un fichier ZIP', ar: 'اضغط لاختيار ملف ZIP' },
    'admin.max_recommended': { en: '50 MB recommended', fr: '50 Mo recommandé', ar: 'يُفضّل ألا يتجاوز 50 ميغابايت' },
    'admin.cancel': { en: 'Cancel', fr: 'Annuler', ar: 'إلغاء' },
    'admin.success': { en: 'Success', fr: 'Succès', ar: 'نجاح' },
    'admin.upload_summary': { en: '{pages} page(s) and {segments} segment(s) uploaded.', fr: '{pages} page(s) et {segments} segment(s) importé(s).', ar: 'تم رفع {pages} صفحة و{segments} من الأسطر.' },
    'admin.no_valid_zip': { en: 'No valid content found in the ZIP.', fr: 'Aucun contenu valide trouvé dans le ZIP.', ar: 'لم يتم العثور على محتوى صالح في ملف ZIP.' },
    'admin.reading_zip': { en: 'Reading ZIP file...', fr: 'Lecture du fichier ZIP...', ar: 'جار قراءة ملف ZIP...' },
    'admin.processing_folder': { en: 'Processing {folder}...', fr: 'Traitement de {folder}...', ar: 'جار معالجة {folder}...' },
    'admin.saving_database': { en: 'Saving to database...', fr: 'Enregistrement dans la base...', ar: 'جار الحفظ في قاعدة البيانات...' },
    'admin.complete': { en: '{count}% complete', fr: '{count}% terminé', ar: '{count}% مكتمل' },
    'admin.loading_page': { en: 'Loading page...', fr: 'Chargement de la page...', ar: 'جار تحميل الصفحة...' },
    'admin.page_not_found': { en: 'Page not found.', fr: 'Page introuvable.', ar: 'الصفحة غير موجودة.' },
    'admin.back_to_manuscript': { en: 'Back to manuscript', fr: 'Retour au manuscrit', ar: 'العودة إلى المخطوطة' },
    'admin.rename_page': { en: 'Rename page', fr: 'Renommer la page', ar: 'إعادة تسمية الصفحة' },
    'admin.position': { en: 'Position', fr: 'Position', ar: 'الترتيب' },
    'admin.delete_page': { en: 'Delete page', fr: 'Supprimer la page', ar: 'حذف الصفحة' },
    'admin.full_page_scan': { en: 'Full-page scan', fr: 'Scan pleine page', ar: 'صورة الصفحة الكاملة' },
    'admin.lines_count': { en: 'Lines ({count})', fr: 'Lignes ({count})', ar: 'الأسطر ({count})' },
    'admin.add_lines': { en: 'Add lines', fr: 'Ajouter des lignes', ar: 'إضافة أسطر' },
    'admin.cancel_upload': { en: 'Cancel', fr: 'Annuler', ar: 'إلغاء' },
    'admin.line_upload_desc': { en: 'Select line images. They will be added after existing lines, sorted by filename.', fr: 'Sélectionnez des images de lignes. Elles seront ajoutées après les lignes existantes, triées par nom.', ar: 'اختر صور الأسطر. ستُضاف بعد الأسطر الحالية حسب اسم الملف.' },
    'admin.files_ready': { en: '{count} file(s) ready', fr: '{count} fichier(s) prêt(s)', ar: '{count} ملف جاهز' },
    'admin.click_drag_lines': { en: 'Click or drag line images here', fr: 'Cliquez ou glissez les images de lignes ici', ar: 'اضغط أو اسحب صور الأسطر هنا' },
    'admin.upload_lines': { en: 'Upload {count} lines', fr: 'Importer {count} lignes', ar: 'رفع {count} من الأسطر' },
    'admin.no_lines': { en: 'No lines yet.', fr: 'Aucune ligne pour le moment.', ar: 'لا توجد أسطر بعد.' },
    'admin.add_lines_hint': { en: 'Click “Add lines” to upload segment images for this page.', fr: 'Cliquez sur « Ajouter des lignes » pour importer les images des segments de cette page.', ar: 'اضغط على «إضافة أسطر» لرفع صور الأسطر لهذه الصفحة.' },
    'admin.drag_reorder': { en: 'Drag to reorder - changes save automatically', fr: 'Glissez pour réordonner - les changements sont enregistrés automatiquement', ar: 'اسحب لإعادة الترتيب - تُحفظ التغييرات تلقائياً' },
    'admin.review': { en: 'Review', fr: 'Vérifier', ar: 'مراجعة' },
    'admin.delete_line': { en: 'Delete this line', fr: 'Supprimer cette ligne', ar: 'حذف هذا السطر' },
    'admin.current_status': { en: 'Current status', fr: 'Statut actuel', ar: 'الحالة الحالية' },
    'admin.suggested_transcriptions': { en: 'Suggested transcriptions', fr: 'Transcriptions suggérées', ar: 'النسخ المقترحة' },
    'admin.first_submit': { en: 'first submission', fr: 'premier submit', ar: 'أول إرسال' },
    'admin.next_submit': { en: 'later submission', fr: 'submit suivant', ar: 'إرسال لاحق' },
    'admin.close': { en: 'Close', fr: 'Fermer', ar: 'إغلاق' },
    'admin.delete_line_confirm': { en: 'Delete this line segment? This is irreversible.', fr: 'Supprimer cette ligne ? Cette action est irréversible.', ar: 'هل تريد حذف هذا السطر؟ لا يمكن التراجع عن ذلك.' },
    'admin.delete_page_confirm': { en: 'Delete this page and all its lines? This cannot be undone.', fr: 'Supprimer cette page et toutes ses lignes ? Cette action est irréversible.', ar: 'هل تريد حذف هذه الصفحة وكل أسطرها؟ لا يمكن التراجع عن ذلك.' },
    'admin.line_deleted': { en: 'Line deleted', fr: 'Ligne supprimée', ar: 'تم حذف السطر' },
    'admin.page_deleted': { en: 'Page deleted', fr: 'Page supprimée', ar: 'تم حذف الصفحة' },
    'admin.order_saved': { en: 'Order saved', fr: 'Ordre enregistré', ar: 'تم حفظ الترتيب' },
    'admin.transcription_validated': { en: 'Transcription validated', fr: 'Transcription validée', ar: 'تم توثيق النسخ' },
    'admin.lines_added': { en: '{count} line(s) added', fr: '{count} ligne(s) ajoutée(s)', ar: 'تمت إضافة {count} من الأسطر' },
    'admin.file_upload_error': { en: 'Upload failed for {file}', fr: 'Échec du téléchargement de {file}', ar: 'فشل رفع {file}' },
    'admin.consensus_empty': { en: 'Consensus text cannot be empty.', fr: 'Le texte du consensus ne peut pas être vide.', ar: 'لا يمكن أن يكون نص الإجماع فارغاً.' },
    'admin.failed_resolve': { en: 'Failed to resolve', fr: 'Échec de la résolution', ar: 'فشل حل التعارض' },
    'admin.conflict_resolved': { en: 'Conflict resolved', fr: 'Conflit résolu', ar: 'تم حل التعارض' },
    'admin.segment_validated': { en: 'Segment marked as validated.', fr: 'Segment marqué comme validé.', ar: 'تم وضع علامة التوثيق على السطر.' },
    'admin.no_image': { en: 'No image available', fr: 'Aucune image disponible', ar: 'لا توجد صورة' },
    'admin.merged_consensus': { en: 'Merged consensus text', fr: 'Texte de consensus fusionné', ar: 'نص الإجماع المدمج' },
    'admin.edit_finalize': { en: '(Edit to finalize)', fr: '(Modifiez pour finaliser)', ar: '(عدّل النص لإتمامه)' },
    'admin.resolving': { en: 'Resolving...', fr: 'Résolution...', ar: 'جار الحل...' },
    'admin.confirm_resolution': { en: 'Confirm resolution', fr: 'Confirmer la résolution', ar: 'تأكيد الحل' },
    'admin.submitted_count': { en: 'Submitted transcriptions ({count})', fr: 'Transcriptions soumises ({count})', ar: 'النسخ المرسلة ({count})' },
    'admin.anonymous': { en: 'Anonymous', fr: 'Anonyme', ar: 'مجهول' },
    'admin.contributor_added': { en: 'Contributor added', fr: 'Ajout du contributeur', ar: 'أضافه المساهم' },
    'admin.contributor_missing': { en: 'Contributor missing', fr: 'Absence du contributeur', ar: 'حذفه المساهم' },
    'admin.webhooks_configured': { en: 'Configured webhooks', fr: 'Webhooks configurés', ar: 'خطافات الويب المهيأة' },
    'admin.webhooks_desc': { en: 'Webhooks are sent whenever a segment is validated. The payload includes the accepted transcription and its metadata.', fr: 'Les webhooks sont envoyés lorsqu’un segment est validé. La charge utile contient la transcription retenue et ses métadonnées.', ar: 'تُرسل خطافات الويب عند توثيق أي سطر. تتضمن البيانات النص المعتمد وبياناته الوصفية.' },
    'admin.no_webhooks': { en: 'No webhooks configured.', fr: 'Aucun webhook configuré.', ar: 'لا توجد خطافات ويب مهيأة.' },
    'admin.secured': { en: 'Secured', fr: 'Sécurisé', ar: 'مؤمّن' },
    'admin.no_secret': { en: 'No secret', fr: 'Sans secret', ar: 'بدون سر' },
    'admin.created': { en: 'Created', fr: 'Créé le', ar: 'أُنشئ في' },
    'admin.inactive': { en: 'Inactive', fr: 'Inactif', ar: 'غير نشط' },
    'admin.add_webhook': { en: 'Add a webhook', fr: 'Ajouter un webhook', ar: 'إضافة خطاف ويب' },
    'admin.endpoint_url': { en: 'Endpoint URL', fr: 'URL du endpoint', ar: 'عنوان نقطة النهاية' },
    'admin.secret_token': { en: 'Secret token', fr: 'Jeton secret', ar: 'الرمز السري' },
    'admin.optional': { en: 'Optional', fr: 'Facultatif', ar: 'اختياري' },
    'admin.secret_placeholder': { en: 'Optional secret used for HMAC verification', fr: 'Secret facultatif utilisé pour vérifier la signature HMAC', ar: 'سر اختياري للتحقق من توقيع HMAC' },
    'admin.secret_hint': { en: 'Sent as X-Khatt-GPT-Signature when provided.', fr: 'Envoyé dans X-Khatt-GPT-Signature lorsqu’il est renseigné.', ar: 'يُرسل في X-Khatt-GPT-Signature عند توفيره.' },
    'admin.register_webhook': { en: 'Register webhook endpoint', fr: 'Enregistrer le webhook', ar: 'تسجيل نقطة نهاية خطاف الويب' },
    'admin.adding': { en: 'Adding...', fr: 'Ajout...', ar: 'جارٍ الإضافة...' },
    'admin.delete_webhook_confirm': { en: 'Are you sure you want to delete this webhook?', fr: 'Voulez-vous vraiment supprimer ce webhook ?', ar: 'هل تريد حقًا حذف خطاف الويب هذا؟' },
    'admin.webhook_deleted': { en: 'Webhook deleted.', fr: 'Webhook supprimé.', ar: 'تم حذف خطاف الويب.' },
    'admin.webhook_registered': { en: 'Webhook registered.', fr: 'Webhook enregistré.', ar: 'تم تسجيل خطاف الويب.' },
    'admin.deleted': { en: 'Deleted', fr: 'Supprimé', ar: 'تم الحذف' },
    'admin.pdf_url': { en: 'PDF URL', fr: 'URL du PDF', ar: 'رابط PDF' },
    'admin.upload_pdf': { en: 'Upload PDF', fr: 'Importer le PDF', ar: 'رفع PDF' },
    'admin.save_changes': { en: 'Save changes', fr: 'Enregistrer les modifications', ar: 'حفظ التغييرات' },
    'admin.pdf_url_updated': { en: 'PDF URL updated.', fr: 'URL du PDF mise à jour.', ar: 'تم تحديث رابط PDF.' },
    'admin.invalid_pdf': { en: 'Invalid file', fr: 'Fichier invalide', ar: 'ملف غير صالح' },
    'admin.pdf_only': { en: 'Please upload a PDF file.', fr: 'Veuillez importer un fichier PDF.', ar: 'يرجى رفع ملف PDF.' },
    'admin.pdf_uploaded': { en: 'PDF uploaded.', fr: 'PDF importé.', ar: 'تم رفع ملف PDF.' },
    'admin.pdf_linked': { en: 'The PDF has been uploaded and linked.', fr: 'Le PDF a été importé et associé.', ar: 'تم رفع ملف PDF وربطه.' },
    'admin.choose_pdf': { en: 'Click to select a PDF', fr: 'Cliquez pour sélectionner un PDF', ar: 'اضغط لاختيار ملف PDF' },
    'admin.pdf_size_hint': { en: 'PDF, up to 10 MB', fr: 'PDF, 10 Mo maximum', ar: 'PDF، بحد أقصى 10 ميغابايت' },
    'admin.pdf_currently_linked': { en: 'A PDF is currently linked', fr: 'Un PDF est actuellement associé', ar: 'يوجد ملف PDF مرتبط حاليًا' },
    'admin.pdf_contributor_hint': { en: 'Provide the manuscript PDF so contributors can consult it.', fr: 'Ajoutez le PDF du manuscrit pour permettre aux contributeurs de le consulter.', ar: 'أضف ملف PDF للمخطوطة ليتمكن المساهمون من الاطلاع عليه.' },
    'admin.conflict_resolution': { en: 'Conflict resolution', fr: 'Résolution des conflits', ar: 'حل التعارضات' },
    'admin.resolve_conflicts_desc': { en: 'Resolve inconsistencies between contributor transcriptions.', fr: 'Résolvez les divergences entre les transcriptions des contributeurs.', ar: 'حل الاختلافات بين نسخ المساهمين.' },
    'admin.no_conflicts': { en: 'No conflicts found', fr: 'Aucun conflit trouvé', ar: 'لم يتم العثور على تعارضات' },
    'admin.all_segments_clear': { en: 'All segments are currently pending, in progress or validated.', fr: 'Tous les segments sont actuellement en attente, en cours ou validés.', ar: 'جميع الأسطر قيد الانتظار أو المعالجة أو موثقة حاليًا.' },
    'admin.add_page_title': { en: 'Add a new page', fr: 'Ajouter une nouvelle page', ar: 'إضافة صفحة جديدة' },
    'admin.add_page_desc': { en: 'Upload the full-page scan, then add individual line images.', fr: 'Importez le scan pleine page, puis ajoutez les images des lignes.', ar: 'ارفع صورة الصفحة الكاملة ثم أضف صور الأسطر.' },
    'admin.page_label': { en: 'Page label', fr: 'Libellé de la page', ar: 'عنوان الصفحة' },
    'admin.page_default': { en: 'Page', fr: 'Page', ar: 'صفحة' },
    'admin.page_label_placeholder': { en: 'e.g. Page 3 or Folio 12r', fr: 'ex. Page 3 ou folio 12r', ar: 'مثال: الصفحة 3 أو الورقة 12 ظهرًا' },
    'admin.order_position': { en: 'Order position', fr: 'Position dans l’ordre', ar: 'موضع الترتيب' },
    'admin.page_image': { en: 'Page image', fr: 'Image de la page', ar: 'صورة الصفحة' },
    'admin.full_page_dropzone': { en: 'Click or drag a full-page scan here', fr: 'Cliquez ou déposez un scan pleine page ici', ar: 'اضغط أو اسحب صورة الصفحة الكاملة إلى هنا' },
    'admin.image_formats': { en: 'PNG, JPG and WEBP supported', fr: 'PNG, JPG et WEBP acceptés', ar: 'تُقبل صيغ PNG وJPG وWEBP' },
    'admin.page_added': { en: 'Page added', fr: 'Page ajoutée', ar: 'تمت إضافة الصفحة' },
    'admin.page_added_desc': { en: 'You can now upload line images for this page.', fr: 'Vous pouvez maintenant importer les images des lignes de cette page.', ar: 'يمكنك الآن رفع صور أسطر هذه الصفحة.' },
    'admin.page_upload_cta': { en: 'Upload page and add lines', fr: 'Importer la page et ajouter les lignes', ar: 'رفع الصفحة وإضافة الأسطر' },
    'admin.page_upload_failed': { en: 'Page upload failed', fr: 'Échec de l’import de la page', ar: 'فشل رفع الصفحة' },
    'admin.transcription_count': { en: '{count} transcription(s) received', fr: '{count} transcription(s) reçue(s)', ar: 'تم استلام {count} من النسخ' },
    'admin.segmentation_review': { en: 'Segmentation to review', fr: 'Segmentation à revoir', ar: 'التقطيع بحاجة إلى مراجعة' },
    'admin.segmentation': { en: 'Segmentation', fr: 'Segmentation', ar: 'التقطيع' },
    'admin.flagged': { en: 'Flagged', fr: 'Signalé', ar: 'مُبلّغ عنه' },
    'admin.multiple': { en: 'multiple', fr: 'multiples', ar: 'متعددة' },
    'admin.report_count': { en: '{count} report(s)', fr: '{count} signalement(s)', ar: '{count} من البلاغات' },
    'admin.submissions_count': { en: '{count} submission(s)', fr: '{count} soumission(s)', ar: '{count} من الإرسالات' },
    'admin.review_segment': { en: 'Review segment #{count}', fr: 'Vérifier le segment n°{count}', ar: 'مراجعة السطر رقم {count}' },
    'admin.compare_submissions': { en: 'Compare submissions and validate the final transcription.', fr: 'Comparez les soumissions et validez la transcription finale.', ar: 'قارن الإرسالات ووثّق النسخة النهائية.' },
    'admin.segment_alt': { en: 'Segment', fr: 'Segment', ar: 'السطر' },
    'admin.status_conflict_short': { en: 'Conflict', fr: 'Conflit', ar: 'تعارض' },
    'admin.status_review_short': { en: 'To review', fr: 'À vérifier', ar: 'للمراجعة' },
    'admin.status_flagged': { en: 'Flagged', fr: 'Signalé', ar: 'مُبلّغ عنه' },
    'admin.status_archived': { en: 'Archived', fr: 'Archivé', ar: 'مؤرشف' },
    'admin.status_in_progress': { en: 'In progress', fr: 'En cours', ar: 'قيد المعالجة' },
    'admin.validate_version': { en: 'Validate this version', fr: 'Valider cette version', ar: 'توثيق هذه النسخة' },
    'admin.posted_on': { en: 'Posted on', fr: 'Posté le', ar: 'أُرسل في' },
    'admin.no_proposals': { en: 'No transcription submitted yet.', fr: 'Aucune transcription proposée pour le moment.', ar: 'لم تُقترح أي نسخة بعد.' },
    'admin.image_changed': { en: 'Image changed since submission', fr: 'Image modifiée depuis la soumission', ar: 'تغيرت الصورة منذ الإرسال' },
    'admin.view_segment': { en: 'View segment', fr: 'Voir le segment', ar: 'عرض السطر' },
    'admin.view_page_context': { en: 'View page context', fr: 'Voir le contexte de la page', ar: 'عرض سياق الصفحة' },
    'admin.correction_xp_note': { en: 'This contribution already received its correction XP adjustment.', fr: 'Cette contribution a déjà reçu son ajustement XP de correction.', ar: 'حصلت هذه المساهمة بالفعل على تعديل نقاط الخبرة الخاص بالتصحيح.' },
    'admin.edit_xp_note': { en: 'Editing the text removes one quarter of the XP awarded, once.', fr: 'Modifier le texte retirera un quart des XP attribués, une seule fois.', ar: 'سيؤدي تعديل النص إلى خصم ربع نقاط الخبرة الممنوحة مرة واحدة.' },
    'admin.edit_and_validate': { en: 'Edit and validate', fr: 'Modifier et valider', ar: 'تعديل وتوثيق' },
    'admin.reject': { en: 'Reject', fr: 'Refuser', ar: 'رفض' },
    'admin.approve': { en: 'Validate', fr: 'Valider', ar: 'توثيق' },
    'admin.approved': { en: 'Validated', fr: 'Validé', ar: 'موثق' },
    'admin.accept_valid': { en: 'Accept as valid', fr: 'Accepter comme valide', ar: 'قبولها كنسخة صحيحة' },
    'admin.remove_validation': { en: 'Validation removed', fr: 'Validation retirée', ar: 'تمت إزالة التوثيق' },
    'admin.rejected': { en: 'Rejected', fr: 'Refusé', ar: 'مرفوض' },
    'admin.approval_success': { en: 'The transcription was approved as official.', fr: 'La transcription a été approuvée comme officielle.', ar: 'تم اعتماد النسخة كنسخة رسمية.' },
    'admin.reject_confirm': { en: 'Do you really want to reject this transcription? The contributor XP will be removed.', fr: 'Voulez-vous vraiment refuser cette transcription ? Les XP du contributeur seront retirés.', ar: 'هل تريد حقًا رفض هذه النسخة؟ ستُخصم نقاط خبرة المساهم.' },
    'admin.rejection_success': { en: 'The transcription was deleted and XP removed.', fr: 'La transcription a été supprimée et les XP retirés.', ar: 'تم حذف النسخة وخصم نقاط الخبرة.' },
    'admin.bulk_reject_confirm': { en: 'Do you really want to reject these {count} transcriptions?', fr: 'Voulez-vous vraiment rejeter ces {count} transcriptions ?', ar: 'هل تريد حقًا رفض هذه النسخ وعددها {count}؟' },
    'admin.bulk_rejected': { en: '{count} transcriptions were rejected.', fr: '{count} transcriptions ont été rejetées.', ar: 'تم رفض {count} من النسخ.' },
    'admin.all_verified': { en: 'Everything is verified!', fr: 'Tout est vérifié !', ar: 'تم التحقق من كل شيء!' },
    'admin.no_pending': { en: 'There are no transcriptions waiting for validation.', fr: 'Il n’y a plus de transcriptions en attente de validation.', ar: 'لا توجد نسخ بانتظار التوثيق.' },
    'admin.proposals_to_review': { en: '{count} proposal(s) to review across {segments} segment(s).', fr: '{count} proposition(s) à vérifier sur {segments} segment(s).', ar: '{count} من الاقتراحات للمراجعة عبر {segments} من الأسطر.' },
    'admin.proposals_count': { en: '{count} proposal(s)', fr: '{count} proposition(s)', ar: '{count} من الاقتراحات' },
    'admin.select_transcription': { en: 'Select this transcription', fr: 'Sélectionner cette transcription', ar: 'تحديد هذه النسخة' },
    'admin.segments_multiple_contributors': { en: '{count} segment(s) have multiple contributors.', fr: '{count} segment(s) avec plusieurs contributeurs.', ar: '{count} من الأسطر لها مساهمون متعددون.' },
    'admin.selected_count': { en: '{count} selected', fr: '{count} sélectionné(s)', ar: 'تم تحديد {count}' },
    'admin.reject_selection': { en: 'Reject selection', fr: 'Rejeter la sélection', ar: 'رفض التحديد' },
    'admin.compare_same_segment': { en: 'Compare proposals for the same segment before selecting the official version.', fr: 'Comparez les propositions du même segment avant de choisir la version officielle.', ar: 'قارن اقتراحات السطر نفسه قبل اختيار النسخة الرسمية.' },
    'admin.new_conflict': { en: 'New conflict detected', fr: 'Nouveau conflit détecté', ar: 'تم اكتشاف تعارض جديد' },
    'admin.segment_requires_review': { en: 'Segment #{count} requires administrative review.', fr: 'Le segment n°{count} nécessite une vérification administrative.', ar: 'السطر رقم {count} يحتاج إلى مراجعة إدارية.' },
    'admin.proposal_submitted': { en: 'Proposal #{count} · submitted on', fr: 'Proposition n°{count} · soumise le', ar: 'الاقتراح رقم {count} · أُرسل في' },
    'admin.validation_history_load': { en: 'Click to load validation history', fr: 'Cliquez pour charger l’historique des validations', ar: 'اضغط لتحميل سجل التوثيق' },
    'admin.validated_history': { en: 'Validation history', fr: 'Validations effectuées', ar: 'سجل التوثيقات' },
    'admin.load_validations': { en: 'Load validations', fr: 'Charger les validations', ar: 'تحميل عمليات التوثيق' },
    'admin.no_validated_transcriptions': { en: 'No validated transcription yet.', fr: 'Aucune transcription validée pour le moment.', ar: 'لا توجد نسخ موثقة بعد.' },
    'admin.loaded_segments': { en: '{count} validated segment(s) loaded', fr: '{count} segment(s) validé(s) chargé(s)', ar: 'تم تحميل {count} من الأسطر الموثقة' },
    'admin.load_more': { en: 'Load more', fr: 'Charger plus', ar: 'تحميل المزيد' },
    'admin.official_updated': { en: 'The official transcription was updated.', fr: 'La transcription officielle a été mise à jour.', ar: 'تم تحديث النسخة الرسمية.' },
    'admin.view_context': { en: 'View page context', fr: 'Voir le contexte de la page', ar: 'عرض سياق الصفحة' },
    'learn.randomize': { en: 'Shuffle', fr: 'Aléatoire', ar: 'عشوائي' },
    'learn.reveal': { en: 'Click to reveal', fr: 'Cliquer pour révéler', ar: 'اضغط لإظهار النص' },
    'learn.unknown_source': { en: 'Unknown source', fr: 'Source inconnue', ar: 'مصدر غير معروف' },
    'profile.unknown': { en: 'Unknown', fr: 'Inconnu', ar: 'غير معروف' },
    'profile.order': { en: 'Order', fr: 'Ordre', ar: 'الترتيب' },

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
    'learn.hub_title': { en: 'Learn to read', fr: 'Apprendre à lire', ar: 'تعلم القراءة' },
    'learn.hub_desc': { en: 'Study the written heritage and practise reading. Choose a manuscript or train with validated lines.', fr: 'Découvrez le patrimoine écrit et exercez votre lecture. Choisissez un manuscrit ou entraînez-vous avec des lignes validées.', ar: 'اكتشف التراث المكتوب وتدرّب على القراءة. اختر مخطوطة أو تدرب على أسطر موثقة.' },
    'learn.browse_title': { en: 'Browse manuscripts', fr: 'Parcourir les manuscrits', ar: 'تصفح المخطوطات' },
    'learn.browse_desc': { en: 'Explore the historical manuscript library, its progress and its pages.', fr: 'Explorez la bibliothèque de manuscrits historiques, sa progression et ses pages.', ar: 'استكشف مكتبة المخطوطات التاريخية وتقدمها وصفحاتها.' },
    'learn.browse_cta': { en: 'Explore the library', fr: 'Explorer la bibliothèque', ar: 'استكشاف المكتبة' },
    'learn.random_title': { en: 'Random lines', fr: 'Lignes au hasard', ar: 'أسطر عشوائية' },
    'learn.random_desc': { en: 'Read validated segments from different manuscripts and become familiar with varied scripts.', fr: 'Lisez des segments validés de différents manuscrits et familiarisez-vous avec plusieurs écritures.', ar: 'اقرأ أسطراً موثقة من مخطوطات مختلفة وتعرّف على أنماط متنوعة.' },
    'learn.random_cta': { en: 'Start practising', fr: 'Débuter l’entraînement', ar: 'بدء التدريب' },
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
    , 'guide.learn_label': { en: 'Learn', fr: 'Apprendre', ar: 'تعلّم' }
    , 'guide.major_difference': { en: 'Major difference', fr: 'Différence majeure', ar: 'فرق أساسي' }
    , 'guide.styles_desc': { en: 'Discover the main styles you may encounter.', fr: 'Découvrez les principaux styles que vous pourrez rencontrer.', ar: 'اكتشف أهم الخطوط التي قد تصادفها.' }
    , 'guide.style_label': { en: 'Style {style}', fr: 'Style {style}', ar: 'خط {style}' }
    , 'guide.help_title': { en: 'Need more help?', fr: 'Besoin d’aide supplémentaire ?', ar: 'هل تحتاج إلى مساعدة إضافية؟' }
    , 'guide.help_desc': { en: 'Use the Open Panel control on the transcription page to consult the full facsimile or the corresponding printed text.', fr: 'Utilisez le panneau « Ouvrir le panneau » de la page de transcription pour consulter le fac-similé complet ou le texte imprimé correspondant.', ar: 'استخدم زر فتح اللوحة في صفحة النسخ للاطلاع على الصورة الكاملة أو النص المطبوع المطابق.' }
    , 'guide.accuracy_first': { en: 'Accuracy first', fr: 'La précision avant tout', ar: 'الدقة أولاً' }
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
