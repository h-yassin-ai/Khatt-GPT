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

async function test() {
    console.log('--- INSPECTING COLUMNS ---')
    
    // We can't use standard SQL easily if we are using the JS client and not direct DB access
    // But we can just try to fetch one row and see everything
    const { data: segment, error: sError } = await supabase
        .from('segments')
        .select('*')
        .limit(1)
        .single()
    
    if (sError) {
        console.error('Error fetching segment columns:', sError)
    } else {
        console.log('Segment columns:', Object.keys(segment))
    }

    const { data: transcription, error: tError } = await supabase
        .from('transcriptions')
        .select('*')
        .limit(1)
        .single()
    
    if (tError) {
         console.error('Error fetching transcription columns:', tError)
    } else {
        console.log('Transcription columns:', Object.keys(transcription))
    }
}

test().catch(console.error)
