
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Simple parse of .env.local
const env = fs.readFileSync('.env.local', 'utf8')
    .split('\n')
    .reduce((acc, line) => {
        const [key, value] = line.split('=');
        if (key && value) acc[key.trim()] = value.trim();
        return acc;
    }, {});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    // We can't use information_schema easily without raw SQL,
    // but we can just select one row and see the keys.
    const tables = ['transcriptions', 'segments', 'profiles'];
    for (const table of tables) {
        console.log(`--- Table: ${table} ---`);
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.error(`Error with ${table}:`, error.message);
        } else if (data && data.length > 0) {
            console.log(Object.keys(data[0]));
        } else {
            console.log('No rows found, trying to get columns via a blank insert error or similar...');
            // Backup: query RPC or just assume basic columns
        }
    }
}

inspect();
