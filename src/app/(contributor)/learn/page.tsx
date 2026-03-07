import { createClient } from '@/utils/supabase/server'
import { LearnPageClient } from './LearnPageClient'


export default async function LearnPage({ searchParams }: { searchParams: Promise<{ query?: string }> }) {
    const supabase = await createClient()
    const query = (await searchParams).query || ''

    // Fetch segments that have a consensus_text (transcribed, may or may not be admin-validated)
    let segmentsQuery = supabase
        .from('segments')
        .select(`
            id,
            image_url,
            consensus_text,
            status,
            order_index,
            manuscripts!inner ( title )
        `)
        .not('consensus_text', 'is', null)
        .neq('consensus_text', '')
        .order('status', { ascending: false }) // 'validated' sorts after 'pending' alphabetically — use explicit ordering below
        .limit(60)

    if (query) {
        segmentsQuery = segmentsQuery.ilike('consensus_text', `%${query}%`)
    }

    const { data: rawSegments } = await segmentsQuery

    // Sort: validated first, then the rest
    const segments = (rawSegments ?? []).sort((a, b) => {
        if (a.status === 'validated' && b.status !== 'validated') return -1
        if (a.status !== 'validated' && b.status === 'validated') return 1
        return 0
    })

    return (
        <LearnPageClient segments={segments} initialQuery={query} />
    )
}
