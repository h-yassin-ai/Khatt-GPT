import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ProfileInteractive from '../profile/ProfileInteractive'

export default async function ContributionsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    // Fetch profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // Fetch user transcriptions with segment & manuscript details
    const { data: transcriptions } = await supabase
        .from('transcriptions')
        .select(`
            *,
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

    // Calculate accuracy rate (consensus matches)
    // For now, let's just count how many have is_validated = true
    const validatedCount = transcriptions?.filter(t => t.is_validated).length || 0
    const accuracyRate = transcriptions && transcriptions.length > 0
        ? Math.round((validatedCount / transcriptions.length) * 100)
        : null

    // Fetch achievements
    const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('*, achievements(*)')
        .eq('user_id', user.id)

    const achievements = userAchievements?.map(ua => ({
        ...ua.achievements,
        unlocked_at: ua.unlocked_at
    })) || []

    return (
        <main className="container max-w-7xl mx-auto px-4 py-8">
            <div className="mb-10">
                <h1 className="text-4xl font-heading font-bold text-foreground mb-2">Mes Contributions</h1>
                <p className="text-muted-foreground">Consultez et modifiez vos transcriptions passées.</p>
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
