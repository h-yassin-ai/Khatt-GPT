
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function getEnv() {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) {
        console.error('.env.local not found');
        process.exit(1);
    }
    const content = fs.readFileSync(envPath, 'utf-8');
    const env = {};
    content.split('\n').forEach(line => {
        const [key, ...rest] = line.split('=');
        if (key && rest.length > 0) {
            env[key.trim()] = rest.join('=').trim();
        }
    });
    return env;
}

const env = getEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('URL or Key missing from .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function audit() {
    console.log('--- SECURITY AUDIT: TABLE ACCESS & RLS ---');
    
    // We'll try to probe everything important
    const tablesToCheck = [
        'profiles', 'transcriptions', 'segments', 'pages', 'manuscripts', 
        'notifications', 'export_logs', 'achievements', 'contributor_achievements',
        'authors', 'series', 'languages', 'books', 'articles'
    ];
    
    for (const table of tablesToCheck) {
        process.stdout.write(`Checking [${table}]... `);
        const { error } = await supabase.from(table).select('id').limit(1);
        if (error) {
            console.log(`FAIL (${error.code}: ${error.message})`);
        } else {
            console.log(`OK (Accessible via Service Role)`);
        }
    }

    console.log('\n--- ATTEMPTING TO FETCH POLICIES ---');
    // If we can't run raw SQL, we can't check pg_policy. 
    // But we can check if RLS is enabled on profiles by trying to read it with ANON KEY.
    const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (anonKey) {
        const anonSupabase = createClient(supabaseUrl, anonKey);
        console.log('\n--- ANON ACCESS TEST (Simulating Public Access) ---');
        const { data: pAnon, error: eAnon } = await anonSupabase.from('profiles').select('id').limit(1);
        if (eAnon) {
            console.log(`[profiles] PRIVATE/RLS-BLOCKED as expected (Anon Error: ${eAnon.code})`);
        } else {
            console.log(`[profiles] PUBLICLY READABLE (Found ${pAnon?.length || 0} rows)`);
        }
        
        const { data: tAnon, error: etAnon } = await anonSupabase.from('transcriptions').select('id').limit(1);
        if (etAnon) {
            console.log(`[transcriptions] PRIVATE/RLS-BLOCKED as expected (Anon Error: ${etAnon.code})`);
        } else {
            console.log(`[transcriptions] WARN: PUBLICLY READABLE!`);
        }
        
        const { data: nAnon, error: enAnon } = await anonSupabase.from('notifications').select('id').limit(1);
        if (enAnon) {
            console.log(`[notifications] PRIVATE/RLS-BLOCKED as expected (Anon Error: ${enAnon.code})`);
        } else {
            console.log(`[notifications] !! CRITICAL WARN: Notifications are publicly readable !!`);
        }
    }
}

audit().catch(console.error);
