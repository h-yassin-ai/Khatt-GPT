import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { BookOpen, Search, ArrowRight } from 'lucide-react'
import Zoom from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'

export default async function BrowsePage({ searchParams }: { searchParams: Promise<{ query?: string }> }) {
    const supabase = await createClient()
    const query = (await searchParams).query || ''

    // Fetch manuscripts with segment status for progress calculation
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
            ),
            pages (
                image_url,
                order_index
            )
        `)
        .order('created_at', { ascending: false })
        .order('order_index', { referencedTable: 'segments', ascending: true })
        .order('order_index', { referencedTable: 'pages', ascending: true })

    if (query) {
        manuscriptsQuery = manuscriptsQuery.or(`title.ilike.%${query}%,source.ilike.%${query}%`)
    }

    const { data: manuscripts } = await manuscriptsQuery

    return (
        <div className="flex flex-col gap-8 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-heading font-bold text-foreground flex items-center gap-3 mb-2">
                        <BookOpen className="w-8 h-8 text-primary" /> Bibliothèque
                    </h1>
                    <p className="text-muted-foreground w-full max-w-xl">
                        Explorez l'ensemble de notre collection de manuscrits. Suivez l'avancement de la transcription et contribuez à la préservation de notre patrimoine.
                    </p>
                </div>

                <form className="w-full md:w-auto flex items-center relative">
                    <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        name="query"
                        defaultValue={query}
                        placeholder="Rechercher un manuscrit..."
                        className="w-full md:w-80 pl-9 pr-4 py-2 rounded-full border border-border bg-card shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {manuscripts && manuscripts.length > 0 ? (
                    manuscripts.map((ms: any) => {
                        const validatedCount = ms.segments?.filter((s: any) => s.status === 'validated').length || 0
                        const total = ms.total_segments || ms.segments?.length || 1
                        const progress = Math.round((validatedCount / total) * 100)

                        const firstPageImage = ms.pages && ms.pages.length > 0 ? ms.pages[0].image_url : null;
                        const coverImage = firstPageImage || ms.cover_image_url || ms.segments?.[0]?.image_url;

                        return (
                            <div key={ms.id} className="bg-card border border-border hover:border-primary/50 shadow-sm hover:shadow-md rounded-2xl overflow-hidden transition-all flex flex-col group h-full relative">
                                {/* Cover Image Section */}
                                <div className="aspect-[4/5] bg-muted relative overflow-hidden flex items-center justify-center">
                                    {coverImage ? (
                                        <img
                                            src={coverImage}
                                            alt={ms.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground opacity-20">
                                            <BookOpen className="w-16 h-16" />
                                            <span className="font-heading font-bold">KHATT-GPT</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6 gap-3">
                                        <Link 
                                            href={`/transcribe?manuscriptId=${ms.id}`} 
                                            className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-bold shadow-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            Transcrire <ArrowRight className="w-4 h-4" />
                                        </Link>
                                        <Link 
                                            href={`/learn/random?manuscriptId=${ms.id}`} 
                                            className="w-full bg-white/20 backdrop-blur-md text-white border border-white/30 py-2.5 rounded-lg font-bold shadow-xl flex items-center justify-center gap-2 hover:bg-white/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            <BookOpen className="w-4 h-4" /> Lire les segments
                                        </Link>
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="p-6 flex flex-col flex-1 gap-4">
                                    <div className="space-y-1">
                                        <h3 className="font-heading text-xl font-bold text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-2">
                                            {ms.title}
                                        </h3>
                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider truncate">
                                            {ms.source || "Source inconnue"}
                                        </p>
                                    </div>

                                    {ms.description && (
                                        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                                            {ms.description}
                                        </p>
                                    )}

                                    <div className="mt-auto pt-4 space-y-2">
                                        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-tight">
                                            <span className="text-muted-foreground">Progression</span>
                                            <span className="text-primary">{progress}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-primary transition-all duration-1000" 
                                                style={{ width: `${progress}%` }} 
                                            />
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] text-muted-foreground/60 font-medium">
                                            <span>{validatedCount} segments validés</span>
                                            <span>{total} total</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="col-span-full bg-card border border-border border-dashed p-20 rounded-3xl text-center flex flex-col items-center justify-center text-muted-foreground">
                        <BookOpen className="w-16 h-16 mb-4 opacity-50" />
                        <h2 className="text-2xl font-heading font-semibold text-foreground mb-2">Aucun manuscrit trouvé</h2>
                        <p className="max-w-sm">
                            {query 
                                ? `Nous n'avons trouvé aucun résultat pour "${query}".` 
                                : 'La bibliothèque est vide pour le moment.'}
                        </p>
                        {query && (
                            <Link href="/browse" className="mt-6 text-primary hover:underline font-semibold">
                                Effacer la recherche
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
