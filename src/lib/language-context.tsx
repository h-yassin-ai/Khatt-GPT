'use client'

import { createContext, useContext, useState, useEffect } from 'react'

export type Language = 'en' | 'fr'

type LanguageContextType = {
    lang: Language
    setLang: (l: Language) => void
    t: (key: string) => string
}

const translations: Record<string, Record<Language, string>> = {
    // Nav
    'nav.dashboard': { en: 'Dashboard', fr: 'Dashboard' },
    'nav.browse': { en: 'Browse Dataset', fr: 'Parcourir' },
    'nav.transcribe': { en: 'Transcribe', fr: 'Transcrire' },
    'nav.learn': { en: 'Learn to Read', fr: 'Apprendre à lire' },
    'nav.profile': { en: 'Profile', fr: 'Profil' },
    'nav.contributions': { en: 'My Contributions', fr: 'Mes contributions' },
    'nav.admin': { en: 'Admin Panel', fr: 'Panneau Admin' },
    'nav.signout': { en: 'Sign out', fr: 'Se déconnecter' },
    'nav.lang_toggle': { en: 'FR', fr: 'EN' },

    // Onboarding
    'onboarding.title': { en: 'Welcome to Khatt-GPT', fr: 'Bienvenue sur Khatt-GPT' },
    'onboarding.description': {
        en: "You're about to help preserve Maghrebi history. Here's a quick guide on how to contribute and transcribe Arabic manuscripts effectively.",
        fr: 'Vous allez aider à préserver l\'histoire maghrébine. Voici un guide rapide pour contribuer et transcrire des manuscrits arabes efficacement.'
    },
    'onboarding.step1.title': { en: '1. Read the Segment', fr: '1. Lire le segment' },
    'onboarding.step1.desc': {
        en: "You will be presented with an image containing one or a few lines of a historical handwritten manuscript. Use the zoom and pan tools to inspect the ink closely.",
        fr: 'Vous verrez une image contenant une ou quelques lignes d\'un manuscrit historique. Utilisez le zoom et le déplacement pour examiner l\'encre de près.'
    },
    'onboarding.step2.title': { en: '2. Type Exactly What You See', fr: '2. Tapez exactement ce que vous voyez' },
    'onboarding.step2.desc': {
        en: "Transcribe the segment character-by-character. No vocalization is needed, write exactly what you see (e.g., ءاله instead of آله). Accuracy is more important than speed.",
        fr: 'Il ne faut aucune vocalisation et écrire exactement ce qu\'on voit comme ءاله au lieu de آله etc. La précision est plus importante que la vitesse.'
    },
    'onboarding.step3.title': { en: '3. Use "Open Panel" to Help You', fr: '3. Utilisez "Ouvrir le panneau" pour vous aider' },
    'onboarding.step3.desc': {
        en: 'The full manuscript image is displayed above. "Open Panel" gives you access to the printed book text where you can search for the phrase to understand the context — keep in mind that the handwritten manuscript may differ slightly from the printed version due to scribal variations.',
        fr: '"Ouvrir le panneau" vous donne accès au texte du livre imprimé (Référence) où vous pouvez rechercher la phrase pour comprendre le contexte — notez que le manuscrit peut différer légèrement de la version imprimée en raison des variations des copistes. (L\'image de la page entière est déjà intégrée à l\'écran).'
    },
    'onboarding.step4.title': { en: '4. Level Up and Reach Consensus', fr: '4. Progressez et atteignez un consensus' },
    'onboarding.step4.desc': {
        en: "Submit your transcription to earn points and achievements. Your work will be anonymously compared with other scholars to reach a consensus, building a verifiable scholarly dataset.",
        fr: 'Soumettez votre transcription pour gagner des points. Votre travail sera comparé anonymement avec d\'autres chercheurs pour atteindre un consensus, constituant un dataset savant vérifiable.'
    },
    'onboarding.start': { en: 'Start Transcribing', fr: 'Commencer la transcription' },

    // Transcribe page
    'transcribe.session': { en: 'Session', fr: 'Session' },
    'transcribe.segments': { en: 'segments', fr: 'segments' },
    'transcribe.offline': { en: 'Offline Mode', fr: 'Mode hors ligne' },
    'transcribe.open_panel': { en: 'Open Panel', fr: 'Ouvrir le panneau' },
    'transcribe.close_panel': { en: 'Close Panel', fr: 'Fermer le panneau' },
    'transcribe.submit': { en: 'Submit Transcription', fr: 'Valider la transcription' },
    'transcribe.submitting': { en: 'Sending...', fr: 'Envoi...' },
    'transcribe.save_edit': { en: 'Save Edit', fr: 'Sauvegarder' },
    'transcribe.cancel': { en: 'Cancel', fr: 'Annuler' },
    'transcribe.skip': { en: 'Skip', fr: 'Passer' },
    'transcribe.keyboard': { en: 'Keyboard', fr: 'Clavier' },
    'transcribe.hide': { en: 'Hide', fr: 'Masquer' },
    'transcribe.flag': { en: 'Flag as unreadable', fr: 'Signaler comme illisible' },
    'transcribe.non_arabic': { en: 'Note: Non-Arabic characters detected.', fr: 'Note : Caractères non arabes détectés.' },
    'transcribe.all_caught_up': { en: "You're all caught up!", fr: 'Vous avez tout transcrit !' },
    'transcribe.no_segments': { en: 'There are currently no more segments to transcribe. Come back later when new manuscripts are uploaded.', fr: 'Il n\'y a plus de segments à transcrire. Revenez plus tard lorsque de nouveaux manuscrits seront ajoutés.' },
    'transcribe.zoom_hint': { en: 'Scroll to zoom • Drag to pan', fr: 'Molette pour zoomer • Glisser pour déplacer' },
    'transcribe.reset_zoom': { en: 'Reset', fr: 'Réinitialiser' },
    'transcribe.center_line': { en: 'Center on Line', fr: 'Centrer la ligne' },
    'transcribe.instruction': { en: 'Transcribe only the highlighted line', fr: 'Transcrivez uniquement la ligne en surbrillance' },
    'transcribe.submit_hint': { en: 'to validate', fr: 'pour valider' },
    'transcribe.placeholder': { en: 'Type text here...', fr: 'اكتب النص هنا...' },
    'transcribe.skip_title': { en: 'Skip to next', fr: 'Passer au suivant' },
    'transcribe.prev_title': { en: 'Previous segment', fr: 'Segment précédent' },
    'transcribe.auto_zoom': { en: 'Auto-zoom', fr: 'Auto-zoom' },
    'transcribe.transcription_header': { en: 'Transcription', fr: 'نص النسخ' },

    // Browse page
    'browse.title': { en: 'Segment Browser', fr: 'Explorateur de segments' },
    'browse.desc': { en: 'Explore the growing dataset of validated manuscript segments. These transcriptions have reached consensus and are considered definitive.', fr: 'Explorez le dataset croissant de segments de manuscrits validés. Ces transcriptions ont atteint un consensus et sont considérées comme définitives.' },
    'browse.search': { en: 'Search transcriptions...', fr: 'Rechercher des transcriptions...' },
    'browse.no_segments': { en: 'No segments found', fr: 'Aucun segment trouvé' },
    'browse.no_segments_desc': { en: 'There are no validated segments yet. Start transcribing to build the dataset!', fr: 'Aucun segment validé pour le moment. Commencez à transcrire !' },
    'browse.go_transcribe': { en: 'Go to Transcription', fr: 'Aller à la transcription' },
    'browse.contribute': { en: 'Contribute more', fr: 'Contribuer davantage' },

    // Learn page
    'learn.title': { en: 'Learn to Read Manuscripts', fr: 'Apprendre à lire les manuscrits' },
    'learn.desc': { en: 'Browse transcribed lines to train your eye. Each line shows the manuscript image alongside its transcription.', fr: 'Parcourez les lignes transcrites pour entraîner votre regard. Chaque ligne montre l\'image du manuscrit avec sa transcription.' },
    'learn.validated': { en: 'Validated by admin', fr: 'Validé par un admin' },
    'learn.in_progress': { en: 'In progress', fr: 'En cours' },
    'learn.unvalidated': { en: 'The text below is preliminary and has not yet been formally validated. CLIQUER to reveal!', fr: 'Le texte ci-dessous est préliminaire et n\'a pas encore été formellement validé. CLIQUER pour révéler !' },
    'learn.no_segments': { en: 'No transcribed segments available yet.', fr: 'Aucun segment transcrit disponible pour le moment.' },
    'learn.search': { en: 'Search...', fr: 'Rechercher...' },
    'nav.source': { en: 'Source', fr: 'Source' },
    'nav.guide': { en: 'Calligraphy Guide', fr: 'Guide Calligraphie' },

    // Guide page
    'guide.title': { en: 'Maghrebi Calligraphy Guide', fr: 'Guide de la Calligraphie Maghrébine' },
    'guide.desc': {
        en: 'Maghrebi script is one of the oldest and most beautiful Arabic styles. Understanding its unique characteristics is essential for accurate transcription.',
        fr: 'L\'écriture maghrébine est l\'un des styles arabes les plus anciens et les plus beaux. Comprendre ses caractéristiques uniques est essentiel pour une transcription précise.'
    },
    'guide.dots.title': { en: 'The Dotting System', fr: 'Le système de points' },
    'guide.dots.desc': {
        en: 'The Maghrebi system (inherited from Kufi) differs from the Eastern system (Mashreqi) in several ways:',
        fr: 'Le système maghrébin (hérité du Kufi) diffère du système oriental (Mashreqi) sur plusieurs points :'
    },
    'guide.fa.title': { en: 'The letter Faa (ڢ)', fr: 'La lettre Faa (ڢ)' },
    'guide.fa.desc': {
        en: 'In Maghrebi script, the Faa has its single dot BELOW the circle, unlike the Eastern system.',
        fr: 'Dans le système maghrébin, le Faa a son point unique EN DESSOUS de la boucle, contrairement au système oriental.'
    },
    'guide.qaf.title': { en: 'The letter Qaf (ڧ)', fr: 'La lettre Qaf (ڧ)' },
    'guide.qaf.desc': {
        en: 'The Maghrebi Qaf has only ONE dot ABOVE (resembling a standard Faa). Double dots are rare.',
        fr: 'Le Qaf maghrébin n\'a qu\'UN SEUL point AU-DESSUS (ressemblant à un Faa standard). Les deux points sont rares.'
    },
    'guide.nun.title': { en: 'Omitted Dots (Nun, etc.)', fr: 'Points omis (Nun, etc.)' },
    'guide.nun.desc': {
        en: 'In final or isolated positions, the Nun, Qaf, and other letters often have NO point. The shape alone identifies them.',
        fr: 'En position finale ou isolée, le Nun, le Qaf et d\'autres lettres n\'ont souvent AUCUN point. La forme seule suffit à les identifier.'
    },
    'guide.styles.title': { en: 'Calligraphic Styles', fr: 'Styles Calligraphiques' },
    'guide.styles.mabsut': {
        en: 'Mabsut is the balanced, clear style used for main texts and Qurans. It features open curves and horizontal extension.',
        fr: 'Le Mabsut est le style équilibré et clair utilisé pour les textes principaux et les Corans. Il se caractérise par des courbes aérées et une extension horizontale.'
    },
    'guide.styles.mujawhar': {
        en: 'Mujawhar is a dense, cursive style favored by scribes for administrative and scientific manuscripts due to its speed.',
        fr: 'Le Mujawhar est un style cursif et dense, favorisé par les copistes pour les manuscrits administratifs et scientifiques pour sa rapidité.'
    },
    'guide.styles.thuluth': {
        en: 'Thuluth Maghrebi is a majestic, ornamental script used for chapter headings, architecture, and noble titles.',
        fr: 'Le Thuluth Maghrébin est une écriture majestueuse et ornementale, utilisée pour les titres de chapitres, l\'architecture et les titres de noblesse.'
    },
    'guide.styles.koufi': {
        en: 'Kufic is an angular, prehistoric script used in early Quranic manuscripts and monumental inscriptions for its geometric beauty.',
        fr: 'Le Koufi est une écriture angulaire historique, utilisée dans les premiers manuscrits coraniques et les inscriptions monumentales pour sa beauté géométrique.'
    },
    'guide.styles.musnad': {
        en: 'Musnad is the ancient South Arabian script, a monumental and geometric precursor to classical Arabic styles.',
        fr: 'Le Musnad est l\'écriture antique de l\'Arabie du Sud, un précurseur monumental et géométrique des styles arabes classiques.'
    },
}

const LanguageContext = createContext<LanguageContextType>({
    lang: 'fr',
    setLang: () => { },
    t: (key) => translations[key]?.fr ?? translations[key]?.en ?? key,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [lang, setLangState] = useState<Language>('fr')

    useEffect(() => {
        const saved = localStorage.getItem('waraka_lang') as Language | null
        if (saved === 'en' || saved === 'fr') setLangState(saved)
    }, [])

    const setLang = (l: Language) => {
        setLangState(l)
        localStorage.setItem('waraka_lang', l)
    }

    const t = (key: string): string => {
        return translations[key]?.[lang] ?? translations[key]?.en ?? key
    }

    return (
        <LanguageContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LanguageContext.Provider>
    )
}

export const useLanguage = () => useContext(LanguageContext)
