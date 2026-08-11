import { getSegmentsToVerify } from './actions'
import { VerifyPageClient } from './VerifyPageClient'
import { ShieldCheck } from 'lucide-react'
import { getServerLanguage, translateServer } from '@/lib/server-i18n'

export default async function VerifyPage() {
    const language = await getServerLanguage()
    const tx = (key: string) => translateServer(key, language)
    try {
        const segments = await getSegmentsToVerify()
        return (
            <div className="flex flex-col gap-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-heading font-semibold text-foreground flex items-center gap-3">
                        <ShieldCheck className="w-8 h-8 text-primary" />
                        {tx('admin.verify_title')}
                    </h1>
                    <p className="text-muted-foreground">
                        {tx('admin.verify_desc')}
                    </p>
                </div>

                <VerifyPageClient initialSegments={segments} />
            </div>
        )
    } catch (err: any) {
        return (
            <div className="p-8 border border-destructive/20 bg-destructive/5 rounded-xl text-destructive flex flex-col gap-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <div className="flex items-center gap-2 font-bold text-lg">
                    <ShieldCheck className="w-6 h-6" />
                    {tx('admin.load_error')}
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
