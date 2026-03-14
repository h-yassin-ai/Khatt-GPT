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

export async function getManuscriptPages(manuscriptId: string) {
    const supabase = await createClient()
    const { data: pages, error } = await supabase
        .from('pages')
        .select('id, order_index, image_url')
        .eq('manuscript_id', manuscriptId)
        .order('order_index', { ascending: true })

    if (error) throw new Error(error.message)
    return pages
}

export async function getPageSegments(pageId: string) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthenticated')

    const { data: segments, error } = await supabase
        .from('segments')
        .select(`
            id,
            order_index,
            status,
            transcriptions(id, contributor_id)
        `)
        .eq('page_id', pageId)
        .order('order_index', { ascending: true })

    if (error) throw new Error(error.message)

    return segments.map((seg: any) => ({
        ...seg,
        is_done_by_me: seg.transcriptions?.some((t: any) => t.contributor_id === user.id) || false,
        transcription_count: seg.transcriptions?.length || 0
    }))
}

export async function getNextSegment(manuscriptId?: string, targetSegmentId?: string, afterSegmentId?: string, direction: 'next' | 'prev' = 'next') {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    if (targetSegmentId) {
        return getSegmentById(targetSegmentId)
    }

    const { data: p } = await supabase.from('profiles').select('is_suspended').eq('id', user.id).single()
    if (p?.is_suspended) throw new Error('Your account has been suspended by an administrator.')

    const { data: userTranscriptions } = await supabase
        .from('transcriptions')
        .select('segment_id')
        .eq('contributor_id', user.id)

    const transcribedSegmentIds = new Set(userTranscriptions?.map((t: any) => t.segment_id) || [])

    let segmentsData: any[] = [];

    if (manuscriptId) {
        // Sequential mode: order by page index then segment index
        const { data, error } = await supabase
            .from('segments')
            .select(`
                id,
                image_url,
                order_index,
                polygon,
                manuscript_id,
                page_id,
                manuscripts(id, title, description, reference_text_url),
                pages!inner(id, image_url, label, order_index)
            `)
            .neq('status', 'validated')
            .neq('status', 'archived')
            .eq('manuscript_id', manuscriptId)
            .order('order_index', { referencedTable: 'pages', ascending: true })
            .order('order_index', { ascending: true })
            .limit(500)

        if (error) {
            console.error('Error fetching sequential segments:', error)
            throw new Error(`Database error: ${error.message}`)
        }
        segmentsData = data || [];
    } else {
        // Random mode: keep existing logic for random pool
        const countQuery = supabase
            .from('segments')
            .select('*', { count: 'exact', head: true })
            .neq('status', 'validated')
            .neq('status', 'archived')

        const { count: totalActive } = await countQuery

        const poolSize = 300
        const maxOffset = totalActive ? Math.max(0, totalActive - poolSize) : 0
        const randomOffset = Math.floor(Math.random() * (maxOffset + 1))

        const { data, error } = await supabase
            .from('segments')
            .select(`
                id,
                image_url,
                order_index,
                polygon,
                manuscript_id,
                page_id,
                manuscripts(id, title, description, reference_text_url),
                pages(id, image_url, label)
            `)
            .neq('status', 'validated')
            .neq('status', 'archived')
            .range(randomOffset, randomOffset + poolSize - 1)

        if (error) {
            console.error('Error fetching random segments pool:', error)
            throw new Error(`Database error: ${error.message}`)
        }
        segmentsData = data || [];
    }

    if (!segmentsData || segmentsData.length === 0) {
        console.warn('No pending segments found in DB for user', user.id)
        return null
    }

    let availableSegments = segmentsData.filter((seg: any) => !transcribedSegmentIds.has(seg.id))

    if (manuscriptId && afterSegmentId) {
        const currentIndex = segmentsData.findIndex(s => s.id === afterSegmentId);
        if (currentIndex !== -1) {
            if (direction === 'next') {
                const nextAvailable = segmentsData.slice(currentIndex + 1).filter((seg: any) => !transcribedSegmentIds.has(seg.id));
                if (nextAvailable.length > 0) {
                    availableSegments = nextAvailable;
                } else if (manuscriptId) {
                    // Wrap around to the beginning if we reached the end
                    availableSegments = segmentsData.filter((seg: any) => !transcribedSegmentIds.has(seg.id));
                }
            } else {
                // Prev logic: Find the first untranscribed segment BEFORE the current index, reversed
                const prevAvailable = segmentsData.slice(0, currentIndex).reverse().filter((seg: any) => !transcribedSegmentIds.has(seg.id));
                if (prevAvailable.length > 0) {
                    availableSegments = prevAvailable;
                } else if (manuscriptId) {
                    // Wrap around to the end
                    availableSegments = segmentsData.slice().reverse().filter((seg: any) => !transcribedSegmentIds.has(seg.id));
                }
            }
        }
    }

    if (availableSegments.length === 0) {
        if (manuscriptId) {
             availableSegments = segmentsData.filter((seg: any) => !transcribedSegmentIds.has(seg.id));
        }
        
        if (availableSegments.length === 0) {
            console.warn(`User ${user.id} has already transcribed all available segments in this manuscript/pool.`)
            return null
        }
    }

    // In sequential mode, we take the FIRST available in the filtered list (which is already ordered correctly for the direction)
    const segment = manuscriptId ? availableSegments[0] : availableSegments[Math.floor(Math.random() * availableSegments.length)];

    // Fetch existing transcriptions for this segment by other users to show as references
    const { data: otherData } = await supabase
        .from('transcriptions')
        .select('text, contributor_id')
        .eq('segment_id', segment.id)
        .neq('contributor_id', user.id)
        .order('submitted_at', { ascending: false })
        .limit(10)

    let otherTranscriptions: any[] = []
    if (otherData && otherData.length > 0) {
        const cIds = Array.from(new Set(otherData.map((d: any) => d.contributor_id)))
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, email, avatar_url, role')
            .in('id', cIds)
        
        const pMap = new Map((profiles || []).map((p: any) => [p.id, p]))
        otherTranscriptions = otherData.map((d: any) => ({
            text: d.text,
            profiles: pMap.get(d.contributor_id) || null
        }))
    }

    return {
        id: segment.id,
        manuscript_id: (segment.manuscripts as any)?.id || segment.manuscript_id || '',
        page_id: (segment.pages as any)?.id || segment.page_id || '',
        image_url: segment.image_url,
        order_index: segment.order_index,
        polygon: segment.polygon,
        manuscript_title: (segment.manuscripts as any)?.title || 'Unknown Manuscript',
        manuscript_description: (segment.manuscripts as any)?.description || '',
        manuscript_reference_text_url: (segment.manuscripts as any)?.reference_text_url || '',
        page_image_url: (segment.pages as any)?.image_url || '',
        page_label: (segment.pages as any)?.label || 'Unknown Page',
        other_transcriptions: otherTranscriptions || [],
    }
}

export async function getSegmentById(segmentId: string) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthenticated')

    const { data: segment, error } = await supabase
        .from('segments')
        .select(`
            *,
            manuscripts(id, title, description, reference_text_url),
            pages(id, image_url, label)
        `)
        .eq('id', segmentId)
        .single()

    if (error || !segment) {
        throw new Error('Segment not found')
    }

    // Fetch existing transcriptions for this segment by other users to show as references
    const { data: otherData } = await supabase
        .from('transcriptions')
        .select('text, contributor_id')
        .eq('segment_id', segment.id)
        .neq('contributor_id', user.id)
        .order('submitted_at', { ascending: false })
        .limit(10)

    let otherTranscriptions: any[] = []
    if (otherData && otherData.length > 0) {
        const cIds = Array.from(new Set(otherData.map((d: any) => d.contributor_id)))
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, email, avatar_url, role')
            .in('id', cIds)
        
        const pMap = new Map((profiles || []).map((p: any) => [p.id, p]))
        otherTranscriptions = otherData.map((d: any) => ({
            text: d.text,
            profiles: pMap.get(d.contributor_id) || null
        }))
    }

    return {
        id: segment.id,
        manuscript_id: segment.manuscripts?.id || '',
        page_id: segment.pages?.id || '',
        image_url: segment.image_url,
        order_index: segment.order_index,
        polygon: segment.polygon,
        manuscript_title: segment.manuscripts?.title || 'Unknown Manuscript',
        manuscript_description: segment.manuscripts?.description || '',
        manuscript_reference_text_url: segment.manuscripts?.reference_text_url || '',
        page_image_url: segment.pages?.image_url || '',
        page_label: segment.pages?.label || 'Unknown Page',
        other_transcriptions: otherTranscriptions || [],
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

    // Fetch segment image_url, polygon and page image at submission time
    const { data: segmentData } = await supabase
        .from('segments')
        .select('image_url, transcription_count, polygon, page_id, pages(image_url)')
        .eq('id', segmentId)
        .single()

    // Pre-compute reward so we can store xp_awarded at insert time
    const { data: profileForReward } = await supabase
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
    if (profileForReward) {
        reward = computeTranscriptionReward(profileForReward)
    }

    const pageImageUrl = (segmentData?.pages as any)?.image_url || null

    const { error: insertError } = await supabase
        .from('transcriptions')
        .insert({
            segment_id: segmentId,
            contributor_id: user.id,
            text: text.trim(),
            image_url: segmentData?.image_url || null,
            page_image_url: pageImageUrl,
            polygon: segmentData?.polygon || null,
            xp_awarded: reward.finalXp,
        })

    if (insertError) return { error: insertError.message }

    const seg = segmentData
    if (seg) {
        await supabase
            .from('segments')
            .update({ transcription_count: (seg.transcription_count || 0) + 1 })
            .eq('id', segmentId)

        await computeConsensus(segmentId)
    }

    const profile = profileForReward

    if (profile) {
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

