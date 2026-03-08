'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { computeConsensus } from '@/lib/consensus'
import { checkAndGrantAchievements } from '@/lib/achievements'
import { buildBadgeProgress, computeTranscriptionReward, getActiveBoosts, getLevelProgress } from '@/lib/gamification'

async function getUnlockedAchievementSlugs(supabase: any, userId: string): Promise<string[]> {
    const { data } = await supabase
        .from('contributor_achievements')
        .select('achievement_slug')
        .eq('contributor_id', userId)

    return (data || []).map((item: any) => item.achievement_slug)
}

async function getAccuracyRate(supabase: any, userId: string): Promise<number | null> {
    const { data } = await supabase
        .from('transcriptions')
        .select('is_validated, segments!inner(status)')
        .eq('contributor_id', userId)
        .eq('segments.status', 'validated')

    const totalConsensus = data?.length || 0
    if (totalConsensus === 0) return null

    const accurateCount = (data || []).filter((t: any) => t.is_validated).length
    return Math.round((accurateCount / totalConsensus) * 100)
}

function buildSnapshot(profile: any, unlockedSlugs: string[], accuracyRate: number | null = null) {
    const level = getLevelProgress(profile?.points || 0)
    const boosts = getActiveBoosts(profile?.current_streak || 0)
    const badges = buildBadgeProgress(profile || {}, unlockedSlugs, accuracyRate)

    return {
        level,
        boosts,
        badges,
        points: profile?.points || 0,
        totalContributions: profile?.total_contributions || 0,
        streak: profile?.current_streak || 0,
        nextBadge: badges.find((b) => !b.unlocked) || null,
    }
}

export async function getGamificationSnapshot() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
        .from('profiles')
        .select('total_contributions, current_streak, points, last_contribution_date')
        .eq('id', user.id)
        .single()

    if (!profile) return null

    const [unlockedSlugs, accuracyRate] = await Promise.all([
        getUnlockedAchievementSlugs(supabase, user.id),
        getAccuracyRate(supabase, user.id),
    ])

    return buildSnapshot(profile, unlockedSlugs, accuracyRate)
}

export async function getNextSegment() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data: p } = await supabase.from('profiles').select('is_suspended').eq('id', user.id).single()
    if (p?.is_suspended) throw new Error('Your account has been suspended by an administrator.')

    const { data: userTranscriptions } = await supabase
        .from('transcriptions')
        .select('segment_id')
        .eq('contributor_id', user.id)

    const transcribedSegmentIds = new Set(userTranscriptions?.map((t: any) => t.segment_id) || [])

    const { count: totalActive } = await supabase
        .from('segments')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'validated')
        .neq('status', 'archived')

    const poolSize = 300
    const maxOffset = totalActive ? Math.max(0, totalActive - poolSize) : 0
    const randomOffset = Math.floor(Math.random() * (maxOffset + 1))

    const { data: segments, error: segmentsError } = await supabase
        .from('segments')
        .select(`
            id,
            image_url,
            order_index,
            polygon,
            manuscripts(title, description, reference_text_url),
            pages(image_url, label)
        `)
        .neq('status', 'validated')
        .neq('status', 'archived')
        .range(randomOffset, randomOffset + poolSize - 1)

    if (segmentsError) {
        console.error('Error fetching segments pool:', segmentsError)
        throw new Error(`Database error: ${segmentsError.message}`)
    }

    if (!segments || segments.length === 0) {
        console.warn('No pending segments found in DB for user', user.id)
        return null
    }

    const availableSegments = segments.filter((seg: any) => !transcribedSegmentIds.has(seg.id))

    if (availableSegments.length === 0) {
        console.warn(
            `User ${user.id} has already transcribed all ${segments.length} segments in pool offset ${randomOffset}.`
        )
        return null
    }

    const randomIdx = Math.floor(Math.random() * availableSegments.length)
    const segment = availableSegments[randomIdx] as any

    return {
        id: segment.id,
        image_url: segment.image_url,
        order_index: segment.order_index,
        polygon: segment.polygon,
        manuscript_title: segment.manuscripts?.title || 'Unknown Manuscript',
        manuscript_description: segment.manuscripts?.description || '',
        manuscript_reference_text_url: segment.manuscripts?.reference_text_url || '',
        page_image_url: segment.pages?.image_url || '',
        page_label: segment.pages?.label || 'Unknown Page',
    }
}

export async function getPendingSegmentCount() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return 0

    const { count } = await supabase
        .from('segments')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'validated')
        .neq('status', 'archived')

    return count || 0
}

export async function submitTranscription(segmentId: string, text: string) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthenticated' }
    if (!text || text.trim() === '') return { error: 'Text cannot be empty' }

    const { data: p } = await supabase.from('profiles').select('is_suspended').eq('id', user.id).single()
    if (p?.is_suspended) return { error: 'Your account is suspended.' }

    if (/(.)\1{4,}/.test(text.trim())) {
        return { error: 'Submission rejected: Repeated characters pattern detected.' }
    }
    if (text.length > 500) {
        return { error: 'Submission rejected: Text exceeds maximum length for a given segment.' }
    }

    const { error: insertError } = await supabase
        .from('transcriptions')
        .insert({
            segment_id: segmentId,
            contributor_id: user.id,
            text: text.trim(),
        })

    if (insertError) return { error: insertError.message }

    const { data: seg } = await supabase.from('segments').select('transcription_count').eq('id', segmentId).single()
    if (seg) {
        await supabase
            .from('segments')
            .update({ transcription_count: (seg.transcription_count || 0) + 1 })
            .eq('id', segmentId)

        await computeConsensus(segmentId)
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('total_contributions, current_streak, last_contribution_date, points')
        .eq('id', user.id)
        .single()

    let reward: any = {
        baseXp: 10,
        bonusXp: 0,
        finalXp: 10,
        multiplier: 1,
        newStreak: 1,
        boosts: [],
    }

    if (profile) {
        reward = computeTranscriptionReward(profile)
        const today = new Date().toISOString().slice(0, 10)

        await supabase
            .from('profiles')
            .update({
                total_contributions: (profile.total_contributions || 0) + 1,
                current_streak: reward.newStreak,
                last_contribution_date: today,
                points: (profile.points || 0) + reward.finalXp,
            })
            .eq('id', user.id)
    }

    const unlockedAchievements = await checkAndGrantAchievements(user.id)

    const [{ data: refreshedProfile }, unlockedSlugs, accuracyRate] = await Promise.all([
        supabase
            .from('profiles')
            .select('total_contributions, current_streak, points, last_contribution_date')
            .eq('id', user.id)
            .single(),
        getUnlockedAchievementSlugs(supabase, user.id),
        getAccuracyRate(supabase, user.id),
    ])

    const gamification = refreshedProfile
        ? buildSnapshot(refreshedProfile, unlockedSlugs, accuracyRate)
        : null

    revalidatePath('/dashboard')
    revalidatePath('/profile')
    revalidatePath('/transcribe')

    return {
        success: true,
        achievements: unlockedAchievements,
        reward,
        gamification,
    }
}

export async function flagSegment(segmentId: string) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthenticated' }

    await supabase.from('segments').update({ status: 'flagged' }).eq('id', segmentId)

    return { success: true }
}

export async function getRecentTranscriptions() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return []

    const { data, error } = await supabase
        .from('transcriptions')
        .select(`
            id,
            text,
            submitted_at,
            segments(id, image_url, order_index, polygon)
        `)
        .eq('contributor_id', user.id)
        .order('submitted_at', { ascending: false })
        .limit(10)

    if (error) {
        console.error('Error fetching recent transcriptions:', error)
        return []
    }

    return (data || []).map((t: any) => ({
        id: t.id,
        text: t.text,
        submitted_at: t.submitted_at,
        segment_id: t.segments.id,
        segment_image: t.segments.image_url,
        segment_index: t.segments.order_index,
        segment_polygon: t.segments.polygon,
    }))
}

export async function updateTranscription(transcriptionId: string, newText: string) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthenticated' }
    if (!newText || newText.trim() === '') return { error: 'Text cannot be empty' }

    const { data: existing, error: fetchError } = await supabase
        .from('transcriptions')
        .select('contributor_id, segment_id')
        .eq('id', transcriptionId)
        .single()

    if (fetchError || !existing) return { error: 'Transcription not found' }
    if (existing.contributor_id !== user.id) return { error: 'Unauthorized' }

    const { error: updateError } = await supabase
        .from('transcriptions')
        .update({ text: newText.trim() })
        .eq('id', transcriptionId)

    if (updateError) return { error: updateError.message }

    await computeConsensus(existing.segment_id)

    revalidatePath('/dashboard')
    revalidatePath('/profile')
    return { success: true }
}

