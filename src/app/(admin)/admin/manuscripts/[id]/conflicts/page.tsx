import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, ArrowLeft } from 'lucide-react'
import ConflictResolver from './ConflictResolver'

export default async function ManuscriptConflictsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    // 1. Verify existence
    const { data: manuscript } = await supabase
        .from('manuscripts')
        .select('id, title')
        .eq('id', id)
        .single()

    if (!manuscript) {
        notFound()
    }

    // 2. Fetch segments with conflicts
    const { data: conflicts } = await supabase
        .from('segments')
        .select(`
            id,
            image_url,
            order_index,
            status,
            transcriptions ( id, text, created_at, profiles ( display_name, id ) )
        `)
        .eq('manuscript_id', id)
        .eq('status', 'conflict')
        .order('order_index', { ascending: true })

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center text-sm text-muted-foreground mb-1 gap-1">
                        <Link href="/admin/manuscripts" className="hover:text-foreground transition-colors">Manuscripts</Link>
                        <ChevronRight className="w-4 h-4" />
                        <Link href={`/admin/manuscripts/${manuscript.id}`} className="hover:text-foreground transition-colors">{manuscript.title}</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-foreground font-medium">Conflicts</span>
                    </div>
                    <h1 className="text-3xl font-heading font-semibold text-foreground">
                        Conflict Resolution
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Resolve inconsistencies between contributor transcriptions.
                    </p>
                </div>
                <Link
                    href={`/admin/manuscripts/${manuscript.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground rounded-md shadow-sm border border-border hover:bg-secondary/80 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Manuscript
                </Link>
            </div>

            {(!conflicts || conflicts.length === 0) ? (
                <div className="p-12 text-center border border-border/50 rounded-xl bg-card">
                    <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-heading font-medium text-foreground mb-2">No Conflicts Found</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                        All segments in this manuscript are currently either pending, in progress, or validated.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-8">
                    {conflicts.map(segment => (
                        <ConflictResolver key={segment.id} segment={segment} manuscriptId={manuscript.id} />
                    ))}
                </div>
            )}
        </div>
    )
}
