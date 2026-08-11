import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Search, Map } from 'lucide-react'
import { getServerLanguage, translateServer } from '@/lib/server-i18n'

// Simple debounce via URL params search
export default async function AdminSearchPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string }>
}) {
    const query = (await searchParams).q || ''
    const supabase = await createClient()
    const language = await getServerLanguage()
    const tx = (key: string, vars?: Record<string, string | number>) => translateServer(key, language, vars)

    let results: any[] = []

    if (query.trim()) {
        const { data } = await supabase
            .from('transcriptions')
            .select(`
                id,
                text,
                is_validated,
                created_at,
                segments (
                    id,
                    manuscript_id,
                    image_url,
                    manuscripts ( title )
                ),
                profiles ( username )
            `)
            .textSearch('text', query, {
                type: 'websearch',
                config: 'arabic'
            })
            .limit(50)

        // Fallback to ilike if textSearch config issues or simply no results
        if (!data || data.length === 0) {
            const { data: fallbackData } = await supabase
                .from('transcriptions')
                .select(`
                    id,
                    text,
                    is_validated,
                    created_at,
                    segments (
                        id,
                        manuscript_id,
                        image_url,
                        manuscripts ( title )
                    ),
                    profiles ( username )
                `)
                .ilike('text', `%${query}%`)
                .limit(50)

            if (fallbackData) results = fallbackData
        } else {
            results = data
        }
    }

    return (
        <div className="flex flex-col gap-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <h1 className="text-3xl font-heading font-semibold text-foreground">{tx('admin.search_title')}</h1>

            <div className="bg-card border border-border shadow-sm rounded-xl p-6">
                <form className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                            type="text"
                            name="q"
                            defaultValue={query}
                            placeholder={tx('admin.search_placeholder')}
                            className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-arabic text-lg"
                            dir="rtl"
                        />
                    </div>
                    <button type="submit" className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 flex items-center shadow-sm">
                        {tx('admin.search_action')}
                    </button>
                </form>
            </div>

            {query && (
                <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-medium text-foreground">
                        {tx('admin.search_results_for')} <span className="font-arabic font-bold text-primary">"{query}"</span> ({results.length})
                    </h2>

                    {results.length === 0 ? (
                        <div className="bg-card border border-border p-8 rounded-xl text-center text-muted-foreground">
                            {tx('admin.no_search_results')}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {results.map(r => (
                                <div key={r.id} className="bg-card border border-border rounded-xl p-6 flex flex-col gap-4 shadow-sm hover:border-primary/50 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-md ${r.is_validated ? 'bg-green-500/10 text-green-600' : 'bg-orange-500/10 text-orange-600'}`}>
                                                {r.is_validated ? tx('admin.validated') : tx('admin.pending')}
                                            </span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                                    </div>

                                    <p className="font-arabic text-xl leading-loose text-foreground bg-[#FAF7F2] p-4 rounded-md border border-border/50 text-right" dir="rtl">
                                        {r.text}
                                    </p>

                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50 text-sm">
                                        <div className="flex flex-col">
                                            <span className="text-muted-foreground text-xs">{tx('admin.manuscript')}</span>
                                            {r.segments?.manuscripts ? (
                                                Array.isArray(r.segments.manuscripts) ? r.segments.manuscripts[0]?.title : (r.segments.manuscripts as any).title
                                            ) : tx('admin.unknown')}
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-muted-foreground text-xs">{tx('admin.contributor')}</span>
                                            <span className="font-mono">@{r.profiles?.username}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-end mt-2">
                                        <Link
                                            href={`/admin/manuscripts/${r.segments?.manuscript_id}`}
                                            className="text-xs bg-muted text-foreground px-3 py-1.5 rounded-md hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-2"
                                        >
                                            <Map className="w-3 h-3" /> {tx('admin.go_to_manuscript')}
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
