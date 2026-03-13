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

async function runCheck() {
    console.log('--- DATABASE STATUS CHECK ---')

    // 1. Pending transcriptions count
    const { count: pendingTCount } = await supabase
        .from('transcriptions')
        .select('*', { count: 'exact', head: true })
        .eq('is_validated', false)
    console.log('Total pending transcriptions (is_validated = false):', pendingTCount)

    // 2. Non-validated segments with at least one transcription
    const { data: segments, error: segError } = await supabase
        .from('segments')
        .select('id, status, transcription_count')
        .neq('status', 'validated')

    const segmentsWithT = segments?.filter(s => (s as any).transcription_count > 0) || []
    console.log('Segments (status != validated) with transcription_count > 0:', segmentsWithT.length)
    
    // 3. Actually check transcriptions per segment for these segments
    const { data: allT, error: tError } = await supabase
        .from('transcriptions')
        .select('id, segment_id')
        .eq('is_validated', false)
    
    const tPerSegment = new Map()
    allT?.forEach((t: any) => {
        tPerSegment.set(t.segment_id, (tPerSegment.get(t.segment_id) || 0) + 1)
    })
    
    console.log('Actual number of segments having at least one pending transcription:', tPerSegment.size)

    // 4. Check if any segment has transcriptions but status is validated
    const { data: validatedSegments } = await supabase
        .from('segments')
        .select('id')
        .eq('status', 'validated')
    
    const validatedIds = new Set(validatedSegments?.map(s => s.id))
    let tInValidatedSeg = 0
    allT?.forEach((t: any) => {
        if (validatedIds.has(t.segment_id)) tInValidatedSeg++
    })
    console.log('Pending transcriptions linked to already VALIDATED segments:', tInValidatedSeg)

    // 5. Sample check for the 3 segments that ARE appearing
    console.log('Sample of segments with status != validated:')
    console.log(segmentsWithT.slice(0, 5))
}

runCheck().catch(console.error)
