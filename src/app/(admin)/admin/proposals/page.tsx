import { getProposals } from './actions'
import { ProposalsManager } from './ProposalsManager'
import { ScrollText, Sparkles } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminProposalsPage() {
    const { proposals } = await getProposals('all')

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-semibold text-foreground flex items-center gap-3">
                        <ScrollText className="w-8 h-8 text-primary" />
                        Propositions de Manuscrits
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Examinez les témoins et fonds soumis par des chercheurs ou des institutions. Validez-les en 1 clic pour créer le conteneur officiel.
                    </p>
                </div>
            </div>

            <ProposalsManager initialProposals={proposals || []} />
        </div>
    )
}
