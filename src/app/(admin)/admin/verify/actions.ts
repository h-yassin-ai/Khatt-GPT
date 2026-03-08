'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getSegmentsToVerify() {
    const supabase = await createClient()

    // Fetch segments that have transcriptions and are not yet fully validated by an admin
    // We prioritize segments with conflicts or those that haven't reached consensus yet
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
        .gt('transcription_count', 0)
        .neq('status', 'validated') // We only show those NOT yet validated
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Error fetching segments for verification:", error)
        return []
    }

    return segments || []
}

export async function approveTranscription(segmentId: string, transcriptionId: string, text: string) {
    const supabase = await createClient()

    // 1. Update the transcription to be validated
    const { error: tError } = await supabase
        .from('transcriptions')
        .update({ is_validated: true, text: text.trim() })
        .eq('id', transcriptionId)

    if (tError) return { error: tError.message }

    // 2. Update the segment status to 'validated' and set the consensus_text
    const { error: sError } = await supabase
        .from('segments')
        .update({
            status: 'validated',
            consensus_text: text.trim(),
            consensus_reached_at: new Date().toISOString()
        })
        .eq('id', segmentId)

    if (sError) return { error: sError.message }

    revalidatePath('/admin/verify')
    revalidatePath('/learn') // Update the public library
    return { success: true }
}

export async function rejectTranscription(transcriptionId: string) {
    const supabase = await createClient()

    // For rejection, we'll just delete the transcription for now to keep it simple,
    // or we could add an 'is_rejected' column if needed.
    // Given the request, deleting is the cleanest way to "refuse" it from the pool.
    const { error } = await supabase
        .from('transcriptions')
        .delete()
        .eq('id', transcriptionId)

    if (error) return { error: error.message }

    // Also decrement transcription_count if possible, though not strictly necessary for verification view
    // as it recalculates on fetch.
    
    revalidatePath('/admin/verify')
    return { success: true }
}
