'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function validateTranscription(transcriptionId: string, isValid: boolean) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Unauthenticated" }

    // 1. Update transcription validation status
    const { error: tError } = await supabase
        .from('transcriptions')
        .update({ is_validated: isValid })
        .eq('id', transcriptionId)

    if (tError) return { error: tError.message }

    // 2. Fetch the segment id
    const { data: tData } = await supabase
        .from('transcriptions')
        .select('segment_id')
        .eq('id', transcriptionId)
        .single()

    if (tData) {
        // 3. If valid, we mark the whole segment as 'validated' so it doesn't get served to contributors again
        // If false, we might want to revert the segment to 'pending' or 'in_progress'
        const newStatus = isValid ? 'validated' : 'pending'
        await supabase
            .from('segments')
            .update({ status: newStatus })
            .eq('id', tData.segment_id)

        // 4. Trigger Webhooks if validated
        if (isValid) {
            const { data: webhooks } = await supabase
                .from('webhooks')
                .select('*')
                .eq('is_active', true)

            if (webhooks && webhooks.length > 0) {
                // Get the transcription details
                const { data: tDetails } = await supabase
                    .from('transcriptions')
                    .select('text, segments(image_url)')
                    .eq('id', transcriptionId)
                    .single()

                if (tDetails) {
                    const payload = {
                        event: 'segment.validated',
                        data: {
                            transcription_id: transcriptionId,
                            text: tDetails.text,
                            image_url: Array.isArray(tDetails.segments) ? tDetails.segments[0]?.image_url : (tDetails.segments as any)?.image_url
                        },
                        timestamp: new Date().toISOString()
                    }

                    // For each webhook, fire and forget
                    webhooks.forEach(async (wh) => {
                        try {
                            const headers: Record<string, string> = {
                                'Content-Type': 'application/json'
                            }
                            if (wh.secret) headers['X-Waraka-Signature'] = wh.secret

                            fetch(wh.url, {
                                method: 'POST',
                                headers,
                                body: JSON.stringify(payload)
                            }).catch(e => console.error("Webhook failed:", wh.url, e))
                        } catch (e) { }
                    })
                }
            }
        }
    }

    revalidatePath('/admin/manuscripts/[id]', 'page')
    revalidatePath('/admin/export')
    return { success: true }
}
