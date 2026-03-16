
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function getEnv() {
    const envPath = path.resolve(process.cwd(), '.env.local');
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
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkRpc() {
    const { data, error } = await supabase.rpc('execute_sql', { sql_query: "SELECT 1" });
    if (error) {
        console.log(`execute_sql NOT available: ${error.message}`);
    } else {
        console.log("execute_sql IS available!");
    }
}

checkRpc().catch(console.error);
