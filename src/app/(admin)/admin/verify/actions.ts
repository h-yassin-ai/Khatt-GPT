'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

async function assertAdmin(supabase: any) {
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user?.email) return { ok: false, error: 'Unauthorized' }

    const adminEmails = (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map((email) => email.trim())
        .filter(Boolean)

    const userEmail = user.email.toLowerCase()
    if (!adminEmails.map(e => e.toLowerCase()).includes(userEmail)) {
        return { ok: false, error: `Admin access required for ${userEmail}` }
    }

    return { ok: true }
}

async function getAdminClient() {
    // If service role key is available, use it to bypass RLS
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.log('[admin.verify] Using Service Role Key for admin client')
        const { createClient: createAdminClient } = await import('@supabase/supabase-js')
        return createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        )
    }
    console.warn('[admin.verify] SUPABASE_SERVICE_ROLE_KEY missing - falling back to user client (RLS may apply)')
    // Fallback to regular client
    return await createClient()
}

export async function getSegmentsToVerify() {
    const supabase = await createClient()

    const adminCheck = await assertAdmin(supabase)
    if (!adminCheck.ok) {
        console.warn('[admin.verify] Blocked non-admin attempt to fetch segments')
        return []
    }

    // Use admin client for the actual data fetching to bypass RLS
    const adminSupabase = await getAdminClient()

    const { data: segments, error } = await adminSupabase
        .from('segments')
        .select(`
            id,
            image_url,
            polygon,
            status,
            order_index,
            transcription_count,
            manuscripts ( title ),
            pages ( image_url ),
            transcriptions (
                id,
                text,
                submitted_at,
                is_validated,
                contributor_id,
                image_url,
                page_image_url,
                polygon,
                xp_awarded,
                status
            )
        `)
        .neq('status', 'validated')
        .gt('transcription_count', 0)
        .filter('transcriptions.status', 'in', '("pending","modified")')
        .order('created_at', { ascending: false })
        .limit(1000)

    if (error) {
        console.error('[admin.verify] Error fetching segments:', error)
        throw new Error(`Erreur Supabase: ${error.message} (${error.code})`)
    }

    // Debug log to see raw counts
    console.log(`[admin.verify] Found ${segments?.length || 0} non-validated segments`)

    // 1. Collect all unique contributor IDs
    const contributorIds = new Set<string>()
    segments?.forEach((s: any) => {
        s.transcriptions?.forEach((t: any) => {
            if (t.contributor_id) contributorIds.add(t.contributor_id)
        })
    })

    // 2. Fetch those profiles in one go
    const { data: profiles } = await adminSupabase
        .from('profiles')
        .select('id, username, display_name')
        .in('id', Array.from(contributorIds))

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))

    // 3. Assemble and sort
    const withTranscriptions = (segments || [])
        .map((segment: any) => ({
            ...segment,
            transcriptions: (segment.transcriptions || [])
                .map((t: any) => ({
                    ...t,
                    profiles: profileMap.get(t.contributor_id) || null
                }))
                .sort(
                    (a: any, b: any) =>
                        new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
                ),
        }))
        .filter((segment: any) => {
            // Only show segments that have non-rejected transcriptions
            const hasValidDrafts = segment.transcriptions && segment.transcriptions.length > 0
            return hasValidDrafts
        })

    console.log(`[admin.verify] Returning ${withTranscriptions.length} segments with transcriptions to UI`)
    return withTranscriptions
}

export async function getValidatedSegments(page = 0, limit = 20) {
    const supabase = await createClient()

    const adminCheck = await assertAdmin(supabase)
    if (!adminCheck.ok) return []

    const adminSupabase = await getAdminClient()

    const { data: segments, error } = await adminSupabase
        .from('segments')
        .select(`
            id,
            image_url,
            polygon,
            status,
            order_index,
            consensus_text,
            consensus_reached_at,
            manuscripts ( title ),
            pages ( image_url ),
            transcriptions (
                id,
                text,
                submitted_at,
                is_validated,
                contributor_id,
                image_url,
                page_image_url,
                polygon,
                xp_awarded,
                status
            )
        `)
        .eq('status', 'validated')
        .order('consensus_reached_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1)

    if (error) {
        console.error('[admin.verify] Error fetching validated segments:', error)
        return []
    }

    // Collect contributor IDs
    const contributorIds = new Set<string>()
    segments?.forEach((s: any) => {
        s.transcriptions?.forEach((t: any) => {
            if (t.contributor_id) contributorIds.add(t.contributor_id)
        })
    })

    const { data: profiles } = await adminSupabase
        .from('profiles')
        .select('id, username, display_name')
        .in('id', Array.from(contributorIds))

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))

    return (segments || []).map((segment: any) => ({
        ...segment,
        transcriptions: (segment.transcriptions || []).map((t: any) => ({
            ...t,
            profiles: profileMap.get(t.contributor_id) || null
        })),
    }))
}

export async function approveTranscription(segmentId: string, transcriptionId: string, text: string) {
    const supabase = await createClient()

    const adminCheck = await assertAdmin(supabase)
    if (!adminCheck.ok) return { error: adminCheck.error }

    const adminSupabase = await getAdminClient()

    const sanitizedText = text.trim()
    if (!sanitizedText) return { error: 'Transcription text cannot be empty.' }

    // Fetch original transcription to detect modification and get xp_awarded
    const { data: original } = await adminSupabase
        .from('transcriptions')
        .select('text, contributor_id, xp_awarded')
        .eq('id', transcriptionId)
        .single()

    const wasModified = original && original.text.trim() !== sanitizedText
    const newStatus = wasModified ? 'modified' : 'validated'

    const { error: tError } = await adminSupabase
        .from('transcriptions')
        .update({ 
            is_validated: true, 
            text: sanitizedText,
            status: newStatus 
        })
        .eq('id', transcriptionId)

    if (tError) return { error: tError.message }

    // Create notification for the contributor
    if (original?.contributor_id) {
        await adminSupabase
            .from('notifications')
            .insert({
                user_id: original.contributor_id,
                transcription_id: transcriptionId,
                type: newStatus,
                message: wasModified 
                    ? `Votre transcription a été modifiée par un administrateur pour plus de précision.`
                    : `Votre transcription a été validée ! Merci pour votre contribution.`
            })
    }

    // Reset validation flag for alternatives from the same segment.
    await adminSupabase
        .from('transcriptions')
        .update({ is_validated: false, status: 'pending' }) // Reset others to pending if they were something else
        .eq('segment_id', segmentId)
        .neq('id', transcriptionId)

    const { error: sError } = await adminSupabase
        .from('segments')
        .update({
            status: 'validated',
            consensus_text: sanitizedText,
            consensus_reached_at: new Date().toISOString(),
        })
        .eq('id', segmentId)

    if (sError) return { error: sError.message }

    // If text was modified by admin: deduct 1/4 of xp_awarded from the contributor
    if (wasModified && original?.contributor_id && original?.xp_awarded) {
        const deduction = Math.round(original.xp_awarded / 4)
        if (deduction > 0) {
            const { data: profile } = await adminSupabase
                .from('profiles')
                .select('points')
                .eq('id', original.contributor_id)
                .single()

            if (profile) {
                const newPoints = Math.max(0, (profile.points || 0) - deduction)
                await adminSupabase
                    .from('profiles')
                    .update({ points: newPoints })
                    .eq('id', original.contributor_id)
            }
        }
    }

    revalidatePath('/admin')
    revalidatePath('/admin/verify')
    revalidatePath('/learn')
    return { success: true, wasModified }
}

export async function rejectTranscription(transcriptionId: string) {
    const supabase = await createClient()

    const adminCheck = await assertAdmin(supabase)
    if (!adminCheck.ok) return { error: adminCheck.error }

    const adminSupabase = await getAdminClient()

    const { data: transcription, error: fetchError } = await adminSupabase
        .from('transcriptions')
        .select('id, segment_id, contributor_id, xp_awarded')
        .eq('id', transcriptionId)
        .single()

    if (fetchError || !transcription) return { error: 'Transcription not found' }

    // Soft delete: mark as rejected instead of deleting
    const { error: updateError } = await adminSupabase
        .from('transcriptions')
        .update({ 
            status: 'rejected',
            is_validated: false 
        })
        .eq('id', transcriptionId)

    if (updateError) return { error: updateError.message }

    // Create notification for the contributor
    if (transcription.contributor_id) {
        await adminSupabase
            .from('notifications')
            .insert({
                user_id: transcription.contributor_id,
                transcription_id: transcriptionId,
                type: 'rejected',
                message: `Votre transcription a été rejetée car elle ne correspondait pas aux critères de qualité.`
            })
    }

    const { count: remaining } = await adminSupabase
        .from('transcriptions')
        .select('*', { count: 'exact', head: true })
        .eq('segment_id', transcription.segment_id)
        .neq('status', 'rejected')

    await adminSupabase
        .from('segments')
        .update({
            transcription_count: Math.max(0, remaining || 0),
            status: 'pending',
            consensus_text: null,
            consensus_reached_at: null,
        })
        .eq('id', transcription.segment_id)

    // Deduct XP from the contributor
    if (transcription.contributor_id && transcription.xp_awarded) {
        const { data: profile } = await adminSupabase
            .from('profiles')
            .select('points, total_contributions')
            .eq('id', transcription.contributor_id)
            .single()

        if (profile) {
            await adminSupabase
                .from('profiles')
                .update({
                    points: Math.max(0, (profile.points || 0) - transcription.xp_awarded),
                    total_contributions: Math.max(0, (profile.total_contributions || 0) - 1),
                })
                .eq('id', transcription.contributor_id)
        }
    }

    revalidatePath('/admin')
    revalidatePath('/admin/verify')
    return { success: true }
}
