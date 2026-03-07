'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function resolveConflict(segmentId: string, resolvedText: string, manuscriptId: string) {
    const supabase = await createClient()

    // 1. Check admin auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Unauthenticated" }

    // Ensure user is an admin
    const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : []
    if (!user.email || !adminEmails.includes(user.email)) {
        return { error: 'Unauthorized' }
    }

    if (!resolvedText || resolvedText.trim() === '') {
        return { error: 'Consensus text cannot be empty' }
    }

    // 2. Update segment
    const { error } = await supabase.from('segments').update({
        status: 'validated',
        consensus_text: resolvedText,
        consensus_score: 1.0, // Manual admin override
        consensus_reached_at: new Date().toISOString()
    }).eq('id', segmentId)

    if (error) return { error: error.message }

    // 3. Mark all tied transcriptions for this segment as validated just in case, or we leave them.
    // Actually the prompt says: "if ≥ 2/3 of pairs... auto-validate the most central".
    // For manual override, we might just update the segment text. The individual transcriptions stay as they are, but the segment itself is what matters for export.

    // We can mark all matching submissions as validated, but manual merge might match none.
    // For now we just update the segment as validated.

    revalidatePath(`/admin/manuscripts/${manuscriptId}/conflicts`)
    revalidatePath(`/admin/manuscripts/${manuscriptId}`)
    return { success: true }
}
