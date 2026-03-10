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
        en: "Transcribe the segment character-by-character. We've provided a specialized Arabic keyboard with diacritics and correct mapping to aid your work. Accuracy is more important than speed.",
        fr: 'Transcrivez le segment caractère par caractère. Un clavier arabe spécialisé avec diacritiques est fourni pour vous aider. La précision est plus importante que la vitesse.'
    },
    'onboarding.step3.title': { en: '3. Use "Open Panel" to Help You', fr: '3. Utilisez "Ouvrir le panneau" pour vous aider' },
    'onboarding.step3.desc': {
        en: '"Open Panel" gives you two powerful tools: (1) See the full page image of the manuscript to understand the context, and (2) Access the printed book text where you can search for the phrase — keep in mind that the manuscript may differ slightly from the printed version due to scribal variations.',
        fr: '"Ouvrir le panneau" vous donne deux outils : (1) Voir l\'image complète de la page du manuscrit pour comprendre le contexte, et (2) Accéder au texte du livre imprimé où vous pouvez rechercher la phrase — notez que le manuscrit peut différer légèrement de la version imprimée en raison des variations des copistes.'
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
    'transcribe.skip_title': { en: 'Skip to next (Ctrl+Right)', fr: 'Passer au suivant (Ctrl+Right)' },
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
        en: 'Unlike the common Faa, the Maghrebi Faa has its dot BELOW the circle.',
        fr: 'Contrairement au Faa commun, le Faa maghrébin a son point EN DESSOUS de la boucle.'
    },
    'guide.qaf.title': { en: 'The letter Qaf (ڧ)', fr: 'La lettre Qaf (ڧ)' },
    'guide.qaf.desc': {
        en: 'The Maghrebi Qaf has only ONE dot ABOVE, resembling a standard Faa.',
        fr: 'Le Qaf maghrébin n\'a qu\'UN SEUL point AU-DESSUS, ressemblant à un Faa standard.'
    },
    'guide.nun.title': { en: 'The letter Nun (ن)', fr: 'La lettre Nun (ن)' },
    'guide.nun.desc': {
        en: 'In final or isolated positions, the Nun often has NO dot, as the shape is sufficient.',
        fr: 'En position finale ou isolée, le Nun n\'a souvent AUCUN point, sa forme suffisant à le reconnaître.'
    },
    'guide.styles.title': { en: 'Calligraphic Styles', fr: 'Styles Calligraphiques' },
    'guide.styles.mabsut': {
        en: 'Mabsut is the readable, clear style used for main texts and Qur\'ans. It values clarity and horizontal extension.',
        fr: 'Le Mabsut est le style lisible et clair utilisé pour les textes principaux et les Corans. Il privilégie la clarté et l\'extension horizontale.'
    },
    'guide.styles.mujawhar': {
        en: 'Mujawhar is a flowing, cursive style often used for administrative documents and rapid copying.',
        fr: 'Le Mujawhar est un style cursif et fluide, souvent utilisé pour les documents administratifs et la copie rapide.'
    },
    'guide.styles.thuluth': {
        en: 'Thuluth Maghrebi is an ornamental, large script used for titles, architecture, and decorative elements.',
        fr: 'Le Thuluth Maghrébin est une écriture ornementale et large, utilisée pour les titres, l\'architecture et les éléments décoratifs.'
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
