import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { PlusCircle, FileImage } from 'lucide-react'
import ManuscriptListActions from './ManuscriptListActions'

export default async function ManuscriptsListPage() {
    const supabase = await createClient()

    // Fetch manuscripts with segment stats
    const { data: manuscripts } = await supabase
        .from('manuscripts')
        .select(`
      id,
      title,
      source,
      created_at,
      cover_image_url,
      total_segments,
      segments ( id, status, transcription_count )
    `)
        // Filter out segments in the count that are not validated to get accurate progress
        .eq('segments.status', 'validated')
        .order('created_at', { ascending: false })

    return (
        <div className="flex flex-col gap-6">

            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-heading font-semibold text-foreground">Manuscripts</h1>
                <Link
                    href="/admin/manuscripts/new"
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 font-medium shadow-sm transition-all text-sm"
                >
                    <PlusCircle className="w-4 h-4" /> New Manuscript
                </Link>
            </div>

            <div className="bg-card border border-border shadow-sm rounded-xl overflow-hidden mt-4">
                <table className="w-full text-sm text-left align-middle border-collapse">
                    <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                        <tr>
                            <th className="px-6 py-4 font-medium">Cover</th>
                            <th className="px-6 py-4 font-medium">Title & Source</th>
                            <th className="px-6 py-4 font-medium">Status / Progress</th>
                            <th className="px-6 py-4 font-medium">Date Uploaded</th>
                            <th className="px-6 py-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {manuscripts?.map((ms: any) => {
                            // calculate rough completion % based on status 'validated'
                             const validatedCount = ms.segments?.length || 0
                             const total = ms.total_segments || 1
                             const pct = Math.round((validatedCount / total) * 100)

                            let healthColor = 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]'
                            let healthTitle = 'In Progress'
                            
                            if (validatedCount === total && total > 0) {
                                healthColor = 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
                                healthTitle = 'Fully Validated'
                            } else if (validatedCount === 0) {
                                healthColor = 'bg-muted-foreground'
                                healthTitle = 'Not Started'
                            }

                            return (
                                <tr key={ms.id} className="hover:bg-muted/10 transition-colors">
                                    <td className="px-6 py-4">
                                        <Link href={`/admin/manuscripts/${ms.id}`}>
                                            <div className="w-16 h-20 bg-muted border border-border rounded overflow-hidden flex items-center justify-center relative cursor-pointer group">
                                                {ms.cover_image_url ? (
                                                    <img src={ms.cover_image_url || undefined} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                ) : (
                                                    <FileImage className="w-6 h-6 text-muted-foreground" />
                                                )}
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 w-[250px]">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2.5 h-2.5 rounded-full ${healthColor}`} title={healthTitle} />
                                                <Link href={`/admin/manuscripts/${ms.id}`} className="font-semibold text-foreground hover:text-primary transition-colors hover:underline underline-offset-2">
                                                    {ms.title}
                                                </Link>
                                            </div>
                                            <span className="text-xs text-muted-foreground truncate">{ms.source || 'No source provided'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-2 w-48">
                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                <span>{validatedCount} / {ms.total_segments} validated</span>
                                                <span className="font-bold text-foreground">{pct}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                                <div className="h-full bg-primary" style={{ width: `${pct}%` }}></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                                        {new Date(ms.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/admin/manuscripts/${ms.id}`}
                                                className="text-xs font-semibold px-3 py-1.5 border border-border shadow-sm rounded hover:bg-muted text-foreground transition-colors"
                                            >
                                                View
                                            </Link>
                                            <ManuscriptListActions id={ms.id} currentTitle={ms.title} />
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                        {(!manuscripts || manuscripts.length === 0) && (
                            <tr>
                                <td colSpan={5} className="py-12 text-center text-muted-foreground">
                                    No manuscripts uploaded yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
