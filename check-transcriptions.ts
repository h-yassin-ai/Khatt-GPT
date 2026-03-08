import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://olqpqxhebeavktkucori.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9scXBxeGhlYmVhdmt0a3Vjb3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MjU5NzMsImV4cCI6MjA4ODIwMTk3M30.0dPZY-ijqg2rCZT9nCQKkkDMR_jOXPTm6NU2iw1XMu8'
const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyColumns() {
    console.log('--- VERIFYING TRANSCRIPTIONS COLUMNS ---')
    
    // Test generic select *
    const { data, error } = await supabase.from('transcriptions').select('*').limit(1)
    if (error) {
        console.error('Error selecting *:', error)
    } else if (data && data.length > 0) {
        console.log('Available columns in transcriptions:', Object.keys(data[0]))
    } else {
        console.log('No transcriptions found to check columns.')
    }
}

verifyColumns().catch(console.error)
