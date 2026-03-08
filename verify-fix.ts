import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://olqpqxhebeavktkucori.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9scXBxeGhlYmVhdmt0a3Vjb3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MjU5NzMsImV4cCI6MjA4ODIwMTk3M30.0dPZY-ijqg2rCZT9nCQKkkDMR_jOXPTm6NU2iw1XMu8'
const supabase = createClient(supabaseUrl, supabaseKey)

async function verify() {
    console.log('--- START VERIFICATION ---')
    
    // 1. Get count
    const { count: totalActive } = await supabase
        .from('segments')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'validated')
        .neq('status', 'archived')
    
    console.log('Total Active Segments:', totalActive)

    const poolSize = 300
    const maxOffset = totalActive ? Math.max(0, totalActive - poolSize) : 0
    
    // Run multiple trials to see if random offsets work
    for (let i = 0; i < 3; i++) {
        const randomOffset = Math.floor(Math.random() * (maxOffset + 1))
        console.log(`Trial ${i+1}: Random Offset ${randomOffset}`)
        
        const { data: segments, error } = await supabase
            .from('segments')
            .select('id, order_index')
            .neq('status', 'validated')
            .neq('status', 'archived')
            .range(randomOffset, randomOffset + poolSize - 1)
        
        if (error) {
            console.error('Error:', error)
        } else {
            console.log(`Fetched ${segments?.length} segments. First ID: ${segments?.[0]?.id}, Index: ${segments?.[0]?.order_index}`)
        }
    }
}

verify().catch(console.error)
