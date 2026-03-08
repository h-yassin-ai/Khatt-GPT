import { createClient } from '@/utils/supabase/server'

export default async function DebugVerifyPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data: segments, error } = await supabase
        .from('segments')
        .select('id, transcription_count, status')
        .gt('transcription_count', 0)
        .limit(10)

    return (
        <div className="p-8 space-y-4">
            <h1 className="text-2xl font-bold">Debug Verify Data</h1>
            <pre className="p-4 bg-muted rounded">User: {JSON.stringify(user?.email || 'Not logged in', null, 2)}</pre>
            <h2 className="text-xl font-bold">Error</h2>
            <pre className="p-4 bg-red-50 text-red-600 rounded">{JSON.stringify(error, null, 2) || 'None'}</pre>
            <h2 className="text-xl font-bold">Segments ({segments?.length || 0})</h2>
            <pre className="p-4 bg-muted rounded">{JSON.stringify(segments, null, 2)}</pre>
        </div>
    )
}
