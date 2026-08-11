import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ProfileInteractive from '../profile/ProfileInteractive'
import { getServerLanguage, translateServer } from '@/lib/server-i18n'

export default async function ContributionsPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    const language = await getServerLanguage()

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    const { data: transcriptions } = await supabase
        .from('transcriptions')
        .select(`
            id,
            text,
            submitted_at,
            is_validated,
            segments:segment_id (
                id,
                image_url,
                order_index,
                manuscripts:manuscript_id (
                    title
                )
            )
        `)
        .eq('contributor_id', user.id)
        .order('submitted_at', { ascending: false })

    const validatedCount = transcriptions?.filter((t: any) => t.is_validated).length || 0
    const accuracyRate = transcriptions && transcriptions.length > 0
        ? Math.round((validatedCount / transcriptions.length) * 100)
        : null

    const { data: achievementsData } = await supabase
        .from('contributor_achievements')
        .select(`
            achievement_slug,
            unlocked_at,
            achievements (*)
        `)
        .eq('contributor_id', user.id)

    const achievements = (achievementsData || []).map((row: any) => {
        const details = row.achievements || {}
        return {
            slug: row.achievement_slug,
            unlocked_at: row.unlocked_at,
            name: details.name_fr || details.title || details.slug || row.achievement_slug,
            description: details.description_fr || details.description || '',
            points: details.points || 0,
            icon: details.icon || details.icon_name || null,
        }
    })

    return (
        <main className="container max-w-7xl mx-auto px-4 py-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="mb-10">
                <h1 className="text-4xl font-heading font-bold text-foreground mb-2">{translateServer('contributions.title', language)}</h1>
                <p className="text-muted-foreground">{translateServer('contributions.description', language)}</p>
            </div>

            <ProfileInteractive
                profile={profile}
                transcriptions={transcriptions || []}
                accuracyRate={accuracyRate}
                achievements={achievements}
            />
        </main>
    )
}

