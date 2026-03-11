import { createClient } from '@/utils/supabase/server'
import { LearnPageClient } from './LearnPageClient'


export default async function LearnPage({ searchParams }: { searchParams: Promise<{ query?: string, manuscriptId?: string }> }) {
    const supabase = await createClient()
    const query = (await searchParams).query || ''
    const manuscriptId = (await searchParams).manuscriptId || ''

    // 1. Fetch segments that have at least one transcription
    let segmentsQuery = supabase
        .from('segments')
        .select(`
            id,
            image_url,
            consensus_text,
            status,
            order_index,
            transcription_count,
            manuscripts!inner ( title ),
            transcriptions ( text, submitted_at )
        `)
        .gt('transcription_count', 0)
        .order('status', { ascending: false })
        .limit(100)

    if (query) {
        segmentsQuery = segmentsQuery.ilike('consensus_text', `%${query}%`)
    }

    if (manuscriptId) {
        segmentsQuery = segmentsQuery.eq('manuscript_id', manuscriptId)
    }

    const { data: rawSegments } = await segmentsQuery

    // 2. Process segments to add fallback text if consensus_text is missing
    const segments = (rawSegments ?? []).map((seg: any) => {
        let display_text = seg.consensus_text

        // If no consensus yet, use the latest transcription as fallback
        if (!display_text && seg.transcriptions && seg.transcriptions.length > 0) {
            // Sort transcriptions by submitted_at descending
            const sorted = [...seg.transcriptions].sort((a, b) =>
                new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
            )
            display_text = sorted[0].text
        }

        return {
            id: seg.id,
            image_url: seg.image_url,
            consensus_text: display_text,
            status: seg.status,
            order_index: seg.order_index,
            manuscripts: seg.manuscripts,
            transcription_count: seg.transcription_count
        }
    })

    // Sort: validated first, then those with consensus, then others
    segments.sort((a, b) => {
        if (a.status === 'validated' && b.status !== 'validated') return -1
        if (a.status !== 'validated' && b.status === 'validated') return 1
        return 0
    })

    return (
        <LearnPageClient segments={segments} initialQuery={query} />
    )
}
