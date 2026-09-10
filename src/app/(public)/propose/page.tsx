import { ProposalForm } from './ProposalForm'
import { Metadata } from 'next'
import { Landmark, ScrollText, Sparkles, ShieldCheck, Microscope } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Proposer un manuscrit | Khatt-GPT',
    description: 'Soumettez un manuscrit ou fonds documentaire arabe pour enrichir le corpus scientifique et entraîner les modèles HTR de Khatt-GPT.',
}

export default function ProposePage() {
    return (
        <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">

                {/* Hero Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold tracking-wide uppercase mb-4">
                        <Microscope className="w-3.5 h-3.5" />
                        <span>Appel aux chercheurs & institutions</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black tracking-tight text-foreground mb-4">
                        Proposer un manuscrit au corpus
                    </h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
                        Vous menez des recherches sur un témoin textuel, détenez un fac-similé ou souhaitez valoriser un fonds maghrébin ? 
                        Soumettez votre proposition pour intégrer la chaîne de transcription collaborative et d\'entraînement HTR.
                    </p>
                </div>

                {/* 3 Academic Pillars Banner */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 text-left">
                    <div className="p-4 rounded-xl border border-border bg-card/60">
                        <div className="font-semibold text-sm text-foreground flex items-center gap-2 mb-1">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Attribution rigoureuse
                        </div>
                        <p className="text-xs text-muted-foreground">Votre nom et affiliation institutionnelle sont conservés dans la notice scientifique permanente.</p>
                    </div>
                    <div className="p-4 rounded-xl border border-border bg-card/60">
                        <div className="font-semibold text-sm text-foreground flex items-center gap-2 mb-1">
                            <ScrollText className="w-4 h-4 text-primary" /> Rigueur paléographique
                        </div>
                        <p className="text-xs text-muted-foreground">Indexation selon les styles d\'écriture maghrébins (Mabsout, Mujawhar, Thuluth, Sahraoui).</p>
                    </div>
                    <div className="p-4 rounded-xl border border-border bg-card/60">
                        <div className="font-semibold text-sm text-foreground flex items-center gap-2 mb-1">
                            <Landmark className="w-4 h-4 text-amber-600" /> Données ouvertes (TEI & BibTeX)
                        </div>
                        <p className="text-xs text-muted-foreground">Export et citations normalisées pour vos publications et thèses universitaires.</p>
                    </div>
                </div>

                {/* Formulaire interactif */}
                <ProposalForm />

            </div>
        </div>
    )
}
