import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { BookOpen, Search, ArrowRight } from 'lucide-react'
import Zoom from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'

export default async function BrowsePage({ searchParams }: { searchParams: Promise<{ query?: string }> }) {
    const supabase = await createClient()
    const query = (await searchParams).query || ''

    // Fetch validated segments
    let segmentsQuery = supabase
        .from('segments')
        .select(`
            id,
            image_url,
            consensus_text,
            manuscripts!inner ( title )
        `)
        .eq('status', 'validated')
        .order('id', { ascending: false })
        .limit(20)

    if (query) {
        segmentsQuery = segmentsQuery.ilike('consensus_text', `%${query}%`)
    }

    const { data: segments } = await segmentsQuery

    return (
        <div className="flex flex-col gap-8 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-heading font-bold text-foreground flex items-center gap-3 mb-2">
                        <BookOpen className="w-8 h-8 text-primary" /> Segment Browser
                    </h1>
                    <p className="text-muted-foreground w-full max-w-xl">
                        Explore the growing dataset of validated manuscript segments. These transcriptions have reached consensus and are considered definitive.
                    </p>
                </div>

                <form className="w-full md:w-auto flex items-center relative">
                    <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        name="query"
                        defaultValue={query}
                        placeholder="Search transcriptions..."
                        className="w-full md:w-64 pl-9 pr-4 py-2 rounded-full border border-border bg-card shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-arabic"
                        dir="rtl"
                    />
                </form>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {segments && segments.length > 0 ? (
                    segments.map(seg => (
                        <div key={seg.id} className="bg-card border border-border shadow-sm rounded-xl overflow-hidden flex flex-col md:flex-row group hover:border-primary/50 transition-colors">
                            {/* Image side */}
                            <div className="w-full md:w-1/3 bg-muted border-r border-border p-4 flex items-center justify-center relative min-h-[150px]">
                                {seg.image_url ? (
                                    <Zoom>
                                        <img
                                            src={seg.image_url || undefined}
                                            alt="Manuscript segment"
                                            className="max-w-full max-h-48 object-contain rounded drop-shadow-sm"
                                        />
                                    </Zoom>
                                ) : (
                                    <BookOpen className="w-8 h-8 text-muted-foreground opacity-20" />
                                )}
                            </div>

                            {/* Text side */}
                            <div className="w-full md:w-2/3 p-6 flex flex-col justify-between">
                                <div className="space-y-4">
                                    <h3 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                                        {Array.isArray(seg.manuscripts) ? seg.manuscripts[0]?.title : (seg.manuscripts as any)?.title || 'Unknown Source'}
                                    </h3>
                                    <p className="font-arabic text-2xl leading-[2.2] text-foreground text-right" dir="rtl">
                                        {seg.consensus_text}
                                    </p>
                                </div>
                                <div className="pt-4 mt-4 border-t border-border/50 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded font-mono">ID: {seg.id.substring(0, 8)}</span>
                                    <Link href={`/dashboard`} className="text-sm font-semibold text-primary flex items-center gap-1 hover:underline">
                                        Contribute more <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-card border border-border border-dashed p-12 rounded-xl text-center flex flex-col items-center justify-center text-muted-foreground w-full col-span-1">
                        <BookOpen className="w-12 h-12 mb-4 opacity-50" />
                        <h2 className="text-xl font-heading font-semibold text-foreground mb-2">No segments found</h2>
                        <p>{query ? 'No validated segments match your search.' : 'There are no validated segments yet. Start transcribing to build the dataset!'}</p>
                        {!query && (
                            <Link href="/transcribe" className="mt-6 bg-primary text-primary-foreground px-6 py-2 rounded-full font-semibold shadow hover:bg-primary/90 transition-all">
                                Go to Transcription
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
