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
            status,
            order_index,
            transcription_count,
            manuscripts ( title ),
            transcriptions (
                id,
                text,
                submitted_at,
                is_validated,
                profiles!contributor_id ( username, display_name )
            )
        `)
        .neq('status', 'validated')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('[admin.verify] Error fetching segments:', error)
        throw new Error(`Erreur Supabase: ${error.message} (${error.code})`)
    }

    // Debug log to see raw counts
    console.log(`[admin.verify] Found ${segments?.length || 0} non-validated segments`)

    const withTranscriptions = (segments || [])
        .map((segment: any) => ({
            ...segment,
            transcriptions: (segment.transcriptions || []).sort(
                (a: any, b: any) =>
                    new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
            ),
        }))
        .filter((segment: any) => {
            const hasDrafts = segment.transcriptions.length > 0
            if (!hasDrafts) {
                // console.log(`[admin.verify] Segment ${segment.id} has no transcriptions yet`)
            }
            return hasDrafts
        })

    console.log(`[admin.verify] Returning ${withTranscriptions.length} segments with transcriptions to UI`)
    return withTranscriptions
}

export async function approveTranscription(segmentId: string, transcriptionId: string, text: string) {
    const supabase = await createClient()

    const adminCheck = await assertAdmin(supabase)
    if (!adminCheck.ok) return { error: adminCheck.error }

    const adminSupabase = await getAdminClient()

    const sanitizedText = text.trim()
    if (!sanitizedText) return { error: 'Transcription text cannot be empty.' }

    const { error: tError } = await adminSupabase
        .from('transcriptions')
        .update({ is_validated: true, text: sanitizedText })
        .eq('id', transcriptionId)

    if (tError) return { error: tError.message }

    // Reset validation flag for alternatives from the same segment.
    await adminSupabase
        .from('transcriptions')
        .update({ is_validated: false })
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

    revalidatePath('/admin')
    revalidatePath('/admin/verify')
    revalidatePath('/learn')
    return { success: true }
}

export async function rejectTranscription(transcriptionId: string) {
    const supabase = await createClient()

    const adminCheck = await assertAdmin(supabase)
    if (!adminCheck.ok) return { error: adminCheck.error }

    const adminSupabase = await getAdminClient()

    const { data: transcription, error: fetchError } = await adminSupabase
        .from('transcriptions')
        .select('id, segment_id')
        .eq('id', transcriptionId)
        .single()

    if (fetchError || !transcription) return { error: 'Transcription not found' }

    const { error: deleteError } = await adminSupabase
        .from('transcriptions')
        .delete()
        .eq('id', transcriptionId)

    if (deleteError) return { error: deleteError.message }

    const { count: remaining } = await adminSupabase
        .from('transcriptions')
        .select('*', { count: 'exact', head: true })
        .eq('segment_id', transcription.segment_id)

    await adminSupabase
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

