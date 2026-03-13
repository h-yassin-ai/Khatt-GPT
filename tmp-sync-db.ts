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

async function syncCounts() {
    console.log('--- SYNCING TRANSCRIPTION COUNTS ---')

    // 1. Get all segments and their transcriptions count
    const { data: counts, error: cError } = await supabase
        .from('transcriptions')
        .select('segment_id', { count: 'exact' })
    
    if (cError) {
        console.error('Error fetching transcriptions:', cError)
        return
    }

    const tMap = new Map()
    counts.forEach((t: any) => {
        tMap.set(t.segment_id, (tMap.get(t.segment_id) || 0) + 1)
    })

    console.log(`Found ${tMap.size} segments with transcriptions in DB.`)

    // 2. Fetch segments to compare
    const { data: segments, error: sError } = await supabase
        .from('segments')
        .select('id, transcription_count')
    
    if (sError) {
        console.error('Error fetching segments:', sError)
        return
    }

    let updated = 0
    for (const seg of segments) {
        const actualCount = tMap.get(seg.id) || 0
        if (seg.transcription_count !== actualCount) {
            console.log(`Updating segment ${seg.id}: ${seg.transcription_count} -> ${actualCount}`)
            const { error: uError } = await supabase
                .from('segments')
                .update({ transcription_count: actualCount })
                .eq('id', seg.id)
            
            if (uError) {
                console.error(`Error updating segment ${seg.id}:`, uError)
            } else {
                updated++
            }
        }
    }

    console.log(`Sync complete. Updated ${updated} segments.`)
}

syncCounts().catch(console.error)
