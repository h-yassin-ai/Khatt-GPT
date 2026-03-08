import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function debug() {
    console.log('--- START DEBUG ---')
    const { data: { user } } = await supabase.auth.getUser()
    console.log('User ID:', user?.id)

    const { count: totalPending } = await supabase
        .from('segments')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'validated')
    console.log('Total Pending (status != validated):', totalPending)

    const { count: activePending } = await supabase
        .from('segments')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'validated')
        .neq('status', 'archived')
    console.log('Active Pending (status != validated, archived):', activePending)

    if (user) {
        const { data: userTranscriptions } = await supabase
            .from('transcriptions')
            .select('segment_id')
            .eq('contributor_id', user.id)
        
        console.log('User Transcribed Count:', userTranscriptions?.length || 0)

        const transcribedIds = userTranscriptions?.map(t => t.segment_id) || []
        
        let query = supabase
            .from('segments')
            .select('id')
            .neq('status', 'validated')
            .neq('status', 'archived')
        
        if (transcribedIds.length > 0) {
            query = query.not('id', 'in', transcribedIds)
        }
        
        const { data: available, error } = await query.limit(5)
        if (error) {
            console.error('Query Error:', error)
        } else {
            console.log('Available segments for user (first 5):', available?.map(s => s.id))
            console.log('Count of available:', available?.length || 0)
        }
    }
}

debug().catch(console.error)
