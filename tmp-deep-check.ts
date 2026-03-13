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
    console.log('--- DEEP DIVE INTO VALIDATED SEGMENTS WITH PENDING TRANSCRIPTIONS ---')

    // 1. Fetch transcriptions that are NOT validated
    const { data: pendingT } = await supabase
        .from('transcriptions')
        .select('id, segment_id, text, is_validated')
        .eq('is_validated', false)
    
    console.log('Total pending transcriptions:', pendingT?.length)

    // 2. Map segment IDs
    const segmentIds = Array.from(new Set(pendingT?.map(t => t.segment_id)))
    
    // 3. Fetch these segments' statuses
    const { data: segments } = await supabase
        .from('segments')
        .select('id, status, transcription_count')
        .in('id', segmentIds)
    
    const validatedCount = segments?.filter(s => s.status === 'validated').length || 0
    const pendingCount = segments?.filter(s => s.status === 'pending').length || 0
    const otherCount = segments?.filter(s => s.status !== 'pending' && s.status !== 'validated').length || 0

    console.log('Segments status distribution for pending transcriptions:')
    console.log('  Validated:', validatedCount)
    console.log('  Pending:', pendingCount)
    console.log('  Other:', otherCount)

    if (validatedCount > 0) {
        console.log('Sample of validated segments that have PENDING transcriptions:')
        const valWithT = segments?.filter(s => s.status === 'validated').slice(0, 3)
        for (const s of valWithT!) {
            const ts = pendingT?.filter(t => t.segment_id === s.id)
            console.log(` Segment ${s.id}: status=${s.status}, pending_transcriptions_count=${ts?.length}`)
        }
    }
}

runCheck().catch(console.error)
