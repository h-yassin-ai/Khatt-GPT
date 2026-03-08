'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { computeConsensus } from '@/lib/consensus'
import { checkAndGrantAchievements } from '@/lib/achievements'

export async function getNextSegment() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: p } = await supabase.from('profiles').select('is_suspended').eq('id', user.id).single()
    if (p?.is_suspended) throw new Error("Your account has been suspended by an administrator.")

    // We need an untranscribed segment. Using raw SQL with Supabase requires an RPC or a clever query.
    // Since we don't have a direct RPC set up, we can fetch a pool of pending segments and filter out those the user already transcribed.
    // A simple approach: grab 50 pending segments randomly, filter locally based on user transcriptions.
    // For production scale, an RPC procedure is better.

    // Here we use PostgREST features: return a segment that has status 'pending' or 'in_progress', and not already transcribed by user.
    // But doing a direct LEFT JOIN isn't supported without foreign tables trick or RPC.
    // So instead:

    // 1. Get recent segments the user has transcribed to exclude them
    const { data: userTranscriptions } = await supabase
        .from('transcriptions')
        .select('segment_id')
        .eq('contributor_id', user.id)

    const transcribedSegmentIds = userTranscriptions?.map(t => t.segment_id) || []

    // 2. Query segments that are not archived and not in transcribedSegmentIds
    let query = supabase
        .from('segments')
        .select(`
            id, 
            image_url, 
            order_index, 
            polygon,
            manuscripts!inner(title, description, reference_text_url, pdf_url),
            pages!inner(image_url, label)
        `)
        .neq('status', 'archived')

    if (transcribedSegmentIds.length > 0) {
        query = query.not('id', 'in', `(${transcribedSegmentIds.join(',')})`)
    }

    query = query.limit(50)

    const { data: segments, error } = await query

    if (error || !segments || segments.length === 0) {
        return null
    }

    const randomIdx = Math.floor(Math.random() * segments.length)
    const segment = segments[randomIdx] as any

    return {
        id: segment.id,
        image_url: segment.image_url,
        order_index: segment.order_index,
        polygon: segment.polygon,
        manuscript_title: segment.manuscripts.title,
        manuscript_description: segment.manuscripts.description,
        manuscript_reference_text_url: segment.manuscripts.reference_text_url,
        manuscript_pdf_url: segment.manuscripts.pdf_url,
        page_image_url: segment.pages.image_url,
        page_label: segment.pages.label
    }
}

export async function getPendingSegmentCount() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

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
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthenticated" }
    if (!text || text.trim() === '') return { error: "Text cannot be empty" }

    const { data: p } = await supabase.from('profiles').select('is_suspended').eq('id', user.id).single()
    if (p?.is_suspended) return { error: "Your account is suspended." }

    // Spam detection
    if (/(.)\1{4,}/.test(text.trim())) {
        return { error: "Submission rejected: Repeated characters pattern detected." }
    }
    if (text.length > 500) {
        return { error: "Submission rejected: Text exceeds maximum length for a given segment." }
    }

    // 1. Insert Transcription
    const { error: insertError } = await supabase
        .from('transcriptions')
        .insert({
            segment_id: segmentId,
            contributor_id: user.id,
            text: text.trim()
        })

    if (insertError) return { error: insertError.message }

    // 2. Increment transcription_count on segment
    // Using RPC is ideal, but for now we query first
    const { data: seg } = await supabase.from('segments').select('transcription_count').eq('id', segmentId).single()
    if (seg) {
        await supabase.from('segments').update({ transcription_count: seg.transcription_count + 1 }).eq('id', segmentId)

        // Phase 2: Compute consensus on submission
        await computeConsensus(segmentId)
    }

    // 3. Update Profiles contributions
    const { data: profile } = await supabase.from('profiles').select('total_contributions, current_streak, last_contribution_date, points').eq('id', user.id).single()
    if (profile) {
        // rudimentary streak logic:
        const today = new Date().toISOString().split('T')[0]
        let newStreak = profile.current_streak
        if (profile.last_contribution_date !== today) {
            newStreak += 1
        }

        let earnedPoints = 1
        if (newStreak >= 7) earnedPoints = 2 // 1.5x rounded

        await supabase.from('profiles').update({
            total_contributions: profile.total_contributions + 1,
            current_streak: newStreak,
            last_contribution_date: today,
            points: (profile.points || 0) + earnedPoints
        }).eq('id', user.id)
    }

    // Check achievements
    const unlockedAchievements = await checkAndGrantAchievements(user.id)

    revalidatePath('/dashboard')
    revalidatePath('/profile')
    return { success: true, achievements: unlockedAchievements }
}

export async function flagSegment(segmentId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthenticated" }

    // We could add a flag_count or status update to 'flagged'
    await supabase.from('segments').update({ status: 'flagged' }).eq('id', segmentId)

    return { success: true }
}

export async function getRecentTranscriptions() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

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
        console.error("Error fetching recent transcriptions:", error)
        return []
    }

    return data.map((t: any) => ({
        id: t.id,
        text: t.text,
        submitted_at: t.submitted_at,
        segment_id: t.segments.id,
        segment_image: t.segments.image_url,
        segment_index: t.segments.order_index,
        segment_polygon: t.segments.polygon
    }))
}

export async function updateTranscription(transcriptionId: string, newText: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthenticated" }
    if (!newText || newText.trim() === '') return { error: "Text cannot be empty" }

    // 1. Verify ownership and get segment_id
    const { data: existing, error: fetchError } = await supabase
        .from('transcriptions')
        .select('contributor_id, segment_id')
        .eq('id', transcriptionId)
        .single()

    if (fetchError || !existing) return { error: "Transcription not found" }
    if (existing.contributor_id !== user.id) return { error: "Unauthorized" }

    // 2. Update text
    const { error: updateError } = await supabase
        .from('transcriptions')
        .update({ text: newText.trim() })
        .eq('id', transcriptionId)

    if (updateError) return { error: updateError.message }

    // 3. Re-compute consensus for the segment
    await computeConsensus(existing.segment_id)

    revalidatePath('/dashboard')
    revalidatePath('/profile')
    return { success: true }
}

