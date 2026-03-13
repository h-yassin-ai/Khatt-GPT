import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

function getEnv() {
    const envPath = path.resolve(process.cwd(), '.env.local')
    const content = fs.readFileSync(envPath, 'utf-8')
    const env: Record<string, string> = {}
    content.split('\n').forEach(line => {
        const [key, ...rest] = line.split('=')
        if (key && rest.length > 0) {
            env[key.trim()] = rest.join('=').trim()
        }
    })
    return env
}

const env = getEnv()
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl!, supabaseKey!)

async function simulateAction() {
    console.log('--- SIMULATING getSegmentsToVerify ---')

    const { data: segments, error } = await supabase
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
                xp_awarded
            )
        `)
        .neq('status', 'validated')
        .order('created_at', { ascending: false })
        .limit(1000)

    if (error) {
        console.error('Error fetching segments:', error)
        return
    }

    console.log('Raw segments from Supabase:', segments?.length)

    const withTranscriptions = (segments || [])
        .map((segment: any) => ({
            segment_id: segment.id,
            t_count_in_join: segment.transcriptions.length,
            t_count_in_col: segment.transcription_count
        }))
        .filter(s => s.t_count_in_join > 0)

    console.log('Segments with at least one transcription in join:', withTranscriptions.length)
    console.log('Sample of these segments:', withTranscriptions.slice(0, 10))
    
    // Check segments that HAVE transcriptions in DB but [] in join
    const { data: allT } = await supabase.from('transcriptions').select('segment_id')
    const segIdsWithT = new Set(allT?.map(t => t.segment_id))
    
    const missing = segments?.filter(s => segIdsWithT.has(s.id) && s.transcriptions.length === 0)
    console.log('Segments that HAVE transcriptions in DB but join returned empty:', missing?.length)
    if (missing && missing.length > 0) {
        console.log('Sample missing segment ID:', missing[0].id)
    }
}

simulateAction().catch(console.error)
