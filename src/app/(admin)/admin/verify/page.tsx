import { getSegmentsToVerify } from './actions'
import { VerifyPageClient } from './VerifyPageClient'
import { ShieldCheck } from 'lucide-react'

export default async function VerifyPage() {
    try {
        const segments = await getSegmentsToVerify()
        return (
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-heading font-semibold text-foreground flex items-center gap-3">
                        <ShieldCheck className="w-8 h-8 text-primary" />
                        Vérification des Transcriptions
                    </h1>
                    <p className="text-muted-foreground">
                        Examinez les propositions des contributeurs. Validez la meilleure transcription ou modifiez-la pour définir la version officielle.
                    </p>
                </div>

                <VerifyPageClient initialSegments={segments} />
            </div>
        )
    } catch (err: any) {
        return (
            <div className="p-8 border border-destructive/20 bg-destructive/5 rounded-xl text-destructive flex flex-col gap-4">
                <div className="flex items-center gap-2 font-bold text-lg">
                    <ShieldCheck className="w-6 h-6" />
                    Erreur de chargement
                </div>
                <p className="text-sm">
                    Impossible de charger les données de vérification : {err.message || "Erreur inconnue"}
                </p>
                <p className="text-xs opacity-70">
                    Vérifiez que la variable d'environnement SUPABASE_SERVICE_ROLE_KEY est correctement configurée sur Vercel.
                </p>
            </div>
        )
    }
}
