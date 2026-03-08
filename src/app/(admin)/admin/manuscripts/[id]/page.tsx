import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { ChevronLeft, Check, X, FileImage, ShieldCheck } from 'lucide-react'
import ValidationButtons from './ValidationButtons'
import BulkUploadPagesModal from './BulkUploadPagesModal'
import ReferenceTextUpload from './ReferenceTextUpload'
import PdfUrlUpdate from './PdfUrlUpdate'

export default async function ManuscriptDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: manuscript } = await supabase
        .from('manuscripts')
        .select(`
            *,
            pages (
                id,
                image_url,
                order_index,
                created_at,
                segments ( id, status )
            )
        `)
        .eq('id', id)
        .single()

    if (!manuscript) {
        return <div className="p-8 text-center py-20 bg-muted/20 rounded-xl border border-dashed">Manuscript not found</div>
    }

    // Sort pages
    const pages = manuscript.pages?.sort((a: any, b: any) => a.order_index - b.order_index) || []
    const totalLines = pages.reduce((acc: number, p: any) => acc + (p.segments?.length || 0), 0)
    const conflictCount = pages.reduce((acc: number, p: any) => acc + (p.segments?.filter((s: any) => s.status === 'conflict').length || 0), 0)

    return (
        <div className="flex flex-col gap-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <Link href="/admin/manuscripts" className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2">
                        <ChevronLeft className="w-4 h-4" /> Back to List
                    </Link>
                    <h1 className="text-3xl font-heading font-semibold text-foreground flex items-center gap-3">
                        {manuscript.title}
                        <span className="text-sm font-normal bg-muted/50 px-3 py-1 rounded-full text-muted-foreground border border-border">
                            {pages.length} Pages / {totalLines} Lines
                        </span>
                    </h1>
                    <p className="text-muted-foreground">{manuscript.description}</p>
                    <div className="mt-4 max-w-sm flex flex-col gap-3">
                        <ReferenceTextUpload manuscriptId={manuscript.id} currentUrl={manuscript.reference_text_url} />
                        <PdfUrlUpdate manuscriptId={manuscript.id} currentUrl={manuscript.pdf_url} />
                    </div>
                </div>
                <div className="flex gap-3">
                    <BulkUploadPagesModal manuscriptId={manuscript.id} currentMaxOrder={pages.length > 0 ? Math.max(...pages.map((p: any) => p.order_index)) : 0} />
                    <Link
                        href={`/admin/manuscripts/${manuscript.id}/pages/new`}
                        className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md transition-colors shadow-sm font-medium"
                    >
                        + Add Page
                    </Link>
                    {conflictCount > 0 && (
                        <Link
                            href={`/admin/manuscripts/${manuscript.id}/conflicts`}
                            className="inline-flex items-center gap-2 bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 px-4 py-2 rounded-md transition-colors shadow-sm font-medium"
                        >
                            Review {conflictCount} Conflict{conflictCount !== 1 ? 's' : ''}
                        </Link>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">

                {pages.map((page: any) => {
                    const lineCount = page.segments?.length || 0
                    const validatedLines = page.segments?.filter((s: any) => s.status === 'validated').length || 0
                    const conflicts = page.segments?.filter((s: any) => s.status === 'conflict').length || 0

                    return (
                        <Link key={page.id} href={`/admin/manuscripts/${manuscript.id}/pages/${page.id}`}>
                            <div className="bg-card border border-border shadow-sm rounded-xl overflow-hidden hover:ring-2 hover:ring-primary/20 transition-all group">
                                <div className="aspect-[3/4] bg-black/5 relative grayscale group-hover:grayscale-0 transition-all">
                                    {page.image_url && page.image_url.trim() !== "" ? (
                                        <img src={page.image_url || undefined} alt="Page" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <FileImage className="w-8 h-8 text-muted-foreground opacity-20" />
                                        </div>
                                    )}
                                    <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-md px-2 py-1 rounded text-xs font-bold border border-border">
                                        Page {page.order_index}
                                    </div>
                                    {conflicts > 0 && (
                                        <div className="absolute top-3 left-3 bg-destructive text-destructive-foreground px-2 py-1 rounded text-[10px] font-bold animate-pulse">
                                            {conflicts} CONFLICTS
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 flex flex-col gap-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-medium text-foreground">{lineCount} Lines</span>
                                        <span className="text-muted-foreground text-xs">{validatedLines} / {lineCount} validated</span>
                                    </div>
                                    <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary"
                                            style={{ width: `${lineCount > 0 ? (validatedLines / lineCount) * 100 : 0}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    )
                })}

                {pages.length === 0 && (
                    <div className="col-span-full p-20 text-center text-muted-foreground border border-dashed border-border rounded-xl bg-muted/5">
                        <FileImage className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="font-medium">No pages added to this manuscript yet.</p>
                        <p className="text-sm">Click "+ Add Page" to upload the first full page scan.</p>
                    </div>
                )}
            </div>

        </div>
    )
}
