export type Language = 'en' | 'fr' | 'ar'

const translations: Record<string, Record<Language, string>> = {
    'dashboard.resume': {
        en: 'Resume Transcription',
        fr: 'Reprendre la transcription',
        ar: 'استئناف نسخ المخطوطات',
    },
    'dashboard.pending_desc': {
        en: 'There are currently {count} segments waiting to be transcribed.',
        fr: 'Il y a actuellement {count} segments en attente de transcription.',
        ar: 'يوجد حالياً {count} أسطر في انتظار نسخها.',
    },
    'dashboard.start_button': {
        en: 'Start Transcribing',
        fr: 'Commencer à transcrire',
        ar: 'ابدأ النسخ الآن',
    },
    'dashboard.recent_contributions': {
        en: 'Recent Contributions',
        fr: 'Contributions récentes',
        ar: 'أحدث المساهمات',
    },
    'dashboard.top_scholars': {
        en: 'Top Scholars',
        fr: 'Meilleurs chercheurs',
        ar: 'أفضل المساهمين',
    },
    'dashboard.no_contributions': {
        en: "You haven't contributed yet.",
        fr: "Vous n'avez pas encore contribué.",
        ar: 'لم تقم بأي مساهمة بعد.',
    },
    'dashboard.setting_up': {
        en: 'Setting up your profile...',
        fr: 'Configuration de votre profil...',
        ar: 'جاري إعداد ملفك الشخصي...',
    },
    'dashboard.setting_up_desc': {
        en: 'This usually takes a few seconds after signing up.',
        fr: "Cela prend généralement quelques secondes après l'inscription.",
        ar: 'يستغرق هذا عادةً بضع ثوانٍ بعد التسجيل.',
    },
    'dashboard.refresh': {
        en: 'Refresh Page',
        fr: 'Actualiser la page',
        ar: 'تحديث الصفحة',
    },
    'dashboard.streak_days': {
        en: 'days',
        fr: 'jours',
        ar: 'أيام',
    },
    'profile.streak': {
        en: 'Streak',
        fr: 'Série',
        ar: 'سلسلة الأيام',
    },
    'profile.points': {
        en: 'Points',
        fr: 'Points',
        ar: 'النقاط',
    },
    'dashboard.no_image': {
        en: 'No image',
        fr: 'Aucune image',
        ar: 'لا توجد صورة',
    },
    'dashboard.unknown_manuscript': {
        en: 'Unknown manuscript',
        fr: 'Manuscrit inconnu',
        ar: 'مخطوطة غير معروفة',
    },
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
