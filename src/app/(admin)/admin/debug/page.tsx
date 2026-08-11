import { createClient } from '@/utils/supabase/server'
import { getServerLanguage, translateServer } from '@/lib/server-i18n'

export default async function DebugVerifyPage() {
    const supabase = await createClient()
    const language = await getServerLanguage()
    const tx = (key: string, vars?: Record<string, string | number>) => translateServer(key, language, vars)
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data: segments, error } = await supabase
        .from('segments')
        .select('id, transcription_count, status')
        .gt('transcription_count', 0)
        .limit(10)

    return (
        <div className="p-8 space-y-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <h1 className="text-2xl font-bold">{tx('admin.debug_title')}</h1>
            <pre className="p-4 bg-muted rounded">{tx('admin.debug_user')}: {JSON.stringify(user?.email || tx('admin.debug_not_logged'), null, 2)}</pre>
            <h2 className="text-xl font-bold">{tx('admin.debug_error')}</h2>
            <pre className="p-4 bg-red-50 text-red-600 rounded">{JSON.stringify(error, null, 2) || tx('admin.debug_none')}</pre>
            <h2 className="text-xl font-bold">{tx('admin.debug_segments')} ({segments?.length || 0})</h2>
            <pre className="p-4 bg-muted rounded">{JSON.stringify(segments, null, 2)}</pre>
        </div>
    )
}
