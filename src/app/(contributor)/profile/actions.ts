'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateDisplayName(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Unauthenticated" }

    const displayName = formData.get('displayName') as string
    if (!displayName || displayName.trim().length < 2) {
        return { error: "Display name must be at least 2 characters." }
    }

    const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName.trim() })
        .eq('id', user.id)

    if (error) return { error: error.message }

    revalidatePath('/profile')
    revalidatePath('/dashboard')
    return { success: true }
}

export async function deleteTranscription(transcriptionId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Unauthenticated" }

    // Check if transcription belongs to user
    const { data: t } = await supabase.from('transcriptions').select('contributor_id, segment_id, xp_awarded').eq('id', transcriptionId).single()

    if (!t || t.contributor_id !== user.id) {
        return { error: "Unauthorized" }
    }

    // Delete transcription
    const { error } = await supabase.from('transcriptions').delete().eq('id', transcriptionId)
    if (error) return { error: error.message }

    // Decrement transcription count on segment
    const { data: seg } = await supabase.from('segments').select('transcription_count').eq('id', t.segment_id).single()
    if (seg && seg.transcription_count > 0) {
        await supabase.from('segments').update({ transcription_count: seg.transcription_count - 1 }).eq('id', t.segment_id)
    }

    // Decrement profile contributions and points
    const { data: profile } = await supabase.from('profiles').select('total_contributions, points').eq('id', user.id).single()
    if (profile) {
        const newPoints = Math.max(0, (profile.points || 0) - (t.xp_awarded || 0))
        const newContributions = Math.max(0, (profile.total_contributions || 0) - 1)
        await supabase.from('profiles').update({
            total_contributions: newContributions,
            points: newPoints
        }).eq('id', user.id)
    }

    revalidatePath('/profile')
    revalidatePath('/dashboard')
    revalidatePath('/contributions')
    return { success: true }
}

export async function updateTranscription(transcriptionId: string, newText: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Unauthenticated" }

    if (!newText || newText.trim().length === 0) {
        return { error: "Text cannot be empty." }
    }

    // Verify ownership
    const { data: t } = await supabase.from('transcriptions').select('contributor_id').eq('id', transcriptionId).single()
    if (!t || t.contributor_id !== user.id) {
        return { error: "Unauthorized" }
    }

    const { error } = await supabase
        .from('transcriptions')
        .update({ text: newText.trim() })
        .eq('id', transcriptionId)

    if (error) return { error: error.message }

    revalidatePath('/profile')
    revalidatePath('/dashboard')
    revalidatePath('/contributions')
    return { success: true }
}
