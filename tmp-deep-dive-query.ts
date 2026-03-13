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

async function deepDive() {
    console.log('--- DEEP DIVE: WHY IS QUERY FILTERING 60+ SEGMENTS? ---')

    // 1. Get a sample pending transcription
    const { data: t } = await supabase
        .from('transcriptions')
        .select('segment_id')
        .eq('is_validated', false)
        .limit(1)
    
    if (!t || t.length === 0) {
        console.log('No pending transcriptions found?!')
        return
    }

    const sid = t[0].segment_id
    console.log(`Targeting Segment ID: ${sid}`)

    // 2. Check the segment itself
    const { data: seg, error: sErr } = await supabase
        .from('segments')
        .select('*')
        .eq('id', sid)
        .single()
    
    if (sErr) {
        console.error('Error fetching segment:', sErr)
        return
    }

    console.log('Segment status:', seg.status)
    console.log('Segment transcription_count:', seg.transcription_count)
    console.log('Segment created_at:', seg.created_at)

    // 3. Try the query with THIS ID
    console.log('\nTrying the query used in actions.ts with this ID included:')
    const { data: qResult, error: qErr } = await supabase
        .from('segments')
        .select('id, status, transcription_count')
        .eq('id', sid)
        .neq('status', 'validated')
        .gt('transcription_count', 0)
    
    console.log('Query result for this ID:', qResult?.length ? 'FOUND' : 'NOT FOUND')
    if (qErr) console.error('Query error:', qErr)

    // 4. List ALL segments with status != validated and transcription_count > 0, NO LIMIT, NO SORT
    console.log('\nFetching ALL segments (no limit, no sort) where status!=validated AND transcription_count>0:')
    const { data: allMatch } = await supabase
        .from('segments')
        .select('id')
        .neq('status', 'validated')
        .gt('transcription_count', 0)
    
    console.log(`Total matching segments found in DB: ${allMatch?.length || 0}`)
    
    // 5. Why did simulation say 3?
    console.log('\nCheck if those 3 are special:')
    const { data: test3 } = await supabase
        .from('segments')
        .select('id, created_at')
        .neq('status', 'validated')
        .gt('transcription_count', 0)
        .order('created_at', { ascending: false })
        .limit(1000)
    
    console.log(`Total found with order/limit: ${test3?.length || 0}`)
}

deepDive().catch(console.error)
