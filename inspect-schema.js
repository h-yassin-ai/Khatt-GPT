
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Service Role Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    console.log('--- Table: transcriptions ---');
    const { data: tData, error: tError } = await supabase.from('transcriptions').select('*').limit(1);
    if (tError) console.error(tError);
    else console.log(Object.keys(tData[0] || {}));

    console.log('--- Table: segments ---');
    const { data: sData, error: sError } = await supabase.from('segments').select('*').limit(1);
    if (sError) console.error(sError);
    else console.log(Object.keys(sData[0] || {}));

    console.log('--- Table: profiles ---');
    const { data: pData, error: pError } = await supabase.from('profiles').select('*').limit(1);
    if (pError) console.error(pError);
    else console.log(Object.keys(pData[0] || {}));
}

inspectSchema();
