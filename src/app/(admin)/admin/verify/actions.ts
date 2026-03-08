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

    if (!adminEmails.includes(user.email)) {
        return { ok: false, error: 'Admin access required' }
    }

    return { ok: true }
}

export async function getSegmentsToVerify() {
    const supabase = await createClient()

    const adminCheck = await assertAdmin(supabase)
    if (!adminCheck.ok) {
        console.warn('[admin.verify] Blocked non-admin attempt to fetch segments')
        return []
    }

    const { data: segments, error } = await supabase
        .from('segments')
        .select(`
            id,
            image_url,
            status,
            order_index,
            transcription_count,
            manuscripts ( title ),
            transcriptions (
                id,
                text,
                submitted_at,
                is_validated,
                profiles ( username, display_name )
            )
        `)
        .neq('status', 'validated')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching segments for verification:', error)
        return []
    }

    const withTranscriptions = (segments || [])
        .map((segment: any) => ({
            ...segment,
            transcriptions: (segment.transcriptions || []).sort(
                (a: any, b: any) =>
                    new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
            ),
        }))
        .filter((segment: any) => segment.transcriptions.length > 0)

    return withTranscriptions
}

export async function approveTranscription(segmentId: string, transcriptionId: string, text: string) {
    const supabase = await createClient()

    const adminCheck = await assertAdmin(supabase)
    if (!adminCheck.ok) return { error: adminCheck.error }

    const sanitizedText = text.trim()
    if (!sanitizedText) return { error: 'Transcription text cannot be empty.' }

    const { error: tError } = await supabase
        .from('transcriptions')
        .update({ is_validated: true, text: sanitizedText })
        .eq('id', transcriptionId)

    if (tError) return { error: tError.message }

    // Reset validation flag for alternatives from the same segment.
    await supabase
        .from('transcriptions')
        .update({ is_validated: false })
        .eq('segment_id', segmentId)
        .neq('id', transcriptionId)

    const { error: sError } = await supabase
        .from('segments')
        .update({
            status: 'validated',
            consensus_text: sanitizedText,
            consensus_reached_at: new Date().toISOString(),
        })
        .eq('id', segmentId)

    if (sError) return { error: sError.message }

    revalidatePath('/admin')
    revalidatePath('/admin/verify')
    revalidatePath('/learn')
    return { success: true }
}

export async function rejectTranscription(transcriptionId: string) {
    const supabase = await createClient()

    const adminCheck = await assertAdmin(supabase)
    if (!adminCheck.ok) return { error: adminCheck.error }

    const { data: transcription, error: fetchError } = await supabase
        .from('transcriptions')
        .select('id, segment_id')
        .eq('id', transcriptionId)
        .single()

    if (fetchError || !transcription) return { error: 'Transcription not found' }

    const { error: deleteError } = await supabase
        .from('transcriptions')
        .delete()
        .eq('id', transcriptionId)

    if (deleteError) return { error: deleteError.message }

    const { count: remaining } = await supabase
        .from('transcriptions')
        .select('*', { count: 'exact', head: true })
        .eq('segment_id', transcription.segment_id)

    await supabase
        .from('segments')
        .update({
            transcription_count: Math.max(0, remaining || 0),
            status: 'pending',
            consensus_text: null,
            consensus_reached_at: null,
        })
        .eq('id', transcription.segment_id)

    revalidatePath('/admin')
    revalidatePath('/admin/verify')
    return { success: true }
}

