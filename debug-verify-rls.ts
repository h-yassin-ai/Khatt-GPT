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
    console.log('--- CHECKING FOREIGN KEY CONSTRAINTS ---')
    
    // We can try to query information_schema if we have service_role
    // But many Supabase instances restrict direct SQL via REST unless using RPC or similar.
    // Let's try to see if we can use a query that doesn't use joins first to verify table existence for both.
    
    const { data: t, error: te } = await supabase.from('transcriptions').select('id').limit(1)
    console.log('Transcriptions table accessible:', !te, te?.message || '')

    const { data: p, error: pe } = await supabase.from('profiles').select('id').limit(1)
    console.log('Profiles table accessible:', !pe, pe?.message || '')

    // Try a manual join alternative: fetch segments, then transcriptions, then match.
    // This is a workaround if the FK is truly missing.
    
    // BUT first, let's try to find out why PGRST200 is happening.
    // Is there a "display_name" column in profiles?
    if (!pe && p && p.length > 0) {
        const { data: pDetail } = await supabase.from('profiles').select('*').limit(1).single()
        console.log('Profile columns:', Object.keys(pDetail || {}))
    }
}

test().catch(console.error)
