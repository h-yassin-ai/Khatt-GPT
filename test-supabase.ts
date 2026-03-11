import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
    let manuscriptsQuery = supabase
        .from('manuscripts')
        .select(`
            id,
            title,
            source,
            description,
            cover_image_url,
            total_segments,
            created_at,
            segments ( 
                status,
                image_url,
                order_index
            )
        `)
        .order('created_at', { ascending: false })
        .order('order_index', { referencedTable: 'segments', ascending: true })

    console.log("Fetching...")
    const { data, error } = await manuscriptsQuery
    
    if (error) {
        console.error("ERROR:", error)
    } else {
        console.log("SUCCESS. Data count:", data?.length)
        if (data && data.length > 0) {
            console.log("First item:", data[0].title, data[0].segments?.length, "segments")
        }
    }
}

test()
