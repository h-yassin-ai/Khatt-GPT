import { createClient } from '@/utils/supabase/server'

export async function checkAndGrantAchievements(userId: string) {
    const supabase = await createClient()

    // 1. Fetch user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

    if (!profile) return []

    // 2. Fetch already unlocked achievements
    const { data: existingRecords } = await supabase
        .from('contributor_achievements')
        .select('achievement_slug')
        .eq('contributor_id', userId)

    const existingSlugs = new Set(existingRecords?.map(r => r.achievement_slug) || [])

    // 3. Evaluate conditions
    const toUnlock: string[] = []

    // Novice
    if (profile.total_contributions >= 1 && !existingSlugs.has('first_transcription')) {
        toUnlock.push('first_transcription')
    }

    // Streaks
    if (profile.current_streak >= 3 && !existingSlugs.has('streak_3')) toUnlock.push('streak_3')
    if (profile.current_streak >= 7 && !existingSlugs.has('streak_7')) toUnlock.push('streak_7')
    if (profile.current_streak >= 30 && !existingSlugs.has('streak_30')) toUnlock.push('streak_30')

    // Milestones
    if (profile.total_contributions >= 10 && !existingSlugs.has('transcriptions_10')) toUnlock.push('transcriptions_10')
    if (profile.total_contributions >= 100 && !existingSlugs.has('transcriptions_100')) toUnlock.push('transcriptions_100')
    if (profile.total_contributions >= 500 && !existingSlugs.has('transcriptions_500')) toUnlock.push('transcriptions_500')

    // Night Owl
    const hour = new Date().getHours() // Note: this uses server local time, ideally should use user's timezone, but OK for MVP
    if ((hour >= 0 && hour < 4) && !existingSlugs.has('night_owl')) {
        toUnlock.push('night_owl')
    }

    // Accuracy - deferring to complex query or omitting for simplicity, or we can query it:
    if (!existingSlugs.has('accuracy_90')) {
        const { data: acc } = await supabase
            .from('transcriptions')
            .select(`is_validated, segments!inner(status)`)
            .eq('contributor_id', userId)
            .eq('segments.status', 'validated')

        let accurateCount = 0
        let totalConsensus = acc?.length || 0
        acc?.forEach((t: any) => { if (t.is_validated) accurateCount++ })
        if (totalConsensus >= 20 && (accurateCount / totalConsensus) >= 0.9) {
            toUnlock.push('accuracy_90')
        }
    }

    if (toUnlock.length === 0) return []

    // Fetch details for the toUnlock slugs
    const { data: achievementDetails } = await supabase
        .from('achievements')
        .select('*')
        .in('slug', toUnlock)

    if (!achievementDetails || achievementDetails.length === 0) return []

    // Grant them and add points
    let pointsEarned = 0
    const inserts = achievementDetails.map(a => {
        pointsEarned += a.points
        return {
            contributor_id: userId,
            achievement_slug: a.slug
        }
    })

    await supabase.from('contributor_achievements').insert(inserts)

    // Update profile points
    await supabase.from('profiles').update({
        points: profile.points + pointsEarned
    }).eq('id', userId)

    return achievementDetails
}
