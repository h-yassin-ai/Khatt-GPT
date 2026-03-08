import { getSegmentsToVerify } from './actions'
import { VerifyPageClient } from './VerifyPageClient'
import { ShieldCheck } from 'lucide-react'

export default async function VerifyPage() {
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
}
