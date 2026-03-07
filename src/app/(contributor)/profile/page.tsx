import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ProfileInteractive from './ProfileInteractive'

export default async function ProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // Fetch all user transcriptions
    const { data: transcriptions } = await supabase
        .from('transcriptions')
        .select(`
      id,
      text,
      submitted_at,
      is_validated,
      segments (
        id,
        image_url,
        order_index,
        manuscripts ( title )
      )
    `)
        .eq('contributor_id', user.id)
        .order('submitted_at', { ascending: false })

    // Phase 2: Calculate generic accuracy
    const { data: accuracyQuery } = await supabase
        .from('transcriptions')
        .select(`is_validated, segments!inner(status)`)
        .eq('contributor_id', user.id)
        .eq('segments.status', 'validated')

    let accurateCount = 0
    let totalConsensus = accuracyQuery?.length || 0
    accuracyQuery?.forEach((t: any) => { if (t.is_validated) accurateCount++ })
    const accuracyRate = totalConsensus > 0 ? Math.round((accurateCount / totalConsensus) * 100) : null

    // Phase 2: Fetch achievements
    const { data: achievementsData } = await supabase
        .from('contributor_achievements')
        .select(`
            unlocked_at,
            achievements ( name_fr, description_fr, icon, points )
        `)
        .eq('contributor_id', user.id)
        .order('unlocked_at', { ascending: false })

    const achievements = achievementsData?.map((a: any) => ({
        ...a.achievements,
        unlocked_at: a.unlocked_at
    })) || []

    if (!profile) return <div>Loading...</div>

    return (
        <ProfileInteractive
            profile={profile}
            transcriptions={transcriptions || []}
            accuracyRate={accuracyRate}
            achievements={achievements}
        />
    )
}
