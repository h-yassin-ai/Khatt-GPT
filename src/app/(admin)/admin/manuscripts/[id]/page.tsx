import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { CheckCircle2, ChevronLeft, Circle, ExternalLink, FileImage } from 'lucide-react'
import BulkUploadPagesModal from './BulkUploadPagesModal'
import ReferenceTextUpload from './ReferenceTextUpload'
import PdfUpload from './PdfUpload'
import ManuscriptListActions from '../ManuscriptListActions'

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
                segments ( id, status, segmentation_issue_reported )
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
    const validatedLines = pages.reduce((acc: number, p: any) => acc + (p.segments?.filter((s: any) => s.status === 'validated').length || 0), 0)
    const reviewCount = pages.reduce((acc: number, p: any) => acc + (p.segments?.filter((s: any) => (s.status !== 'validated' && s.status !== 'archived') || s.segmentation_issue_reported).length || 0), 0)
    const conflictCount = pages.reduce((acc: number, p: any) => acc + (p.segments?.filter((s: any) => s.status === 'conflict' || s.segmentation_issue_reported).length || 0), 0)
    const progressPct = totalLines > 0 ? Math.round((validatedLines / totalLines) * 100) : 0
    const scholarlyChecks = [
        { label: 'Titre scientifique', complete: Boolean(manuscript.title?.trim()) },
        { label: 'Institution ou collection', complete: Boolean(manuscript.source?.trim()) },
        { label: 'Contexte et description', complete: Boolean(manuscript.description?.trim()) },
        { label: 'Pages numérisées', complete: pages.length > 0 },
        { label: 'Texte publié de référence', complete: Boolean(manuscript.reference_text_url) },
        { label: 'Fac-similé PDF', complete: Boolean(manuscript.pdf_url) },
        { label: 'Données validées', complete: validatedLines > 0 },
    ]
    const scholarlyScore = Math.round((scholarlyChecks.filter((check) => check.complete).length / scholarlyChecks.length) * 100)

    return (
        <div className="flex flex-col gap-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <Link href="/admin/manuscripts" className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2">
                        <ChevronLeft className="w-4 h-4" /> Retour aux manuscrits
                    </Link>
                    <h1 className="text-3xl font-heading font-semibold text-foreground flex items-center gap-3">
                        {manuscript.title}
                        <span className="text-sm font-normal bg-muted/50 px-3 py-1 rounded-full text-muted-foreground border border-border">
                            {pages.length} pages / {totalLines} lignes
                        </span>
                        <ManuscriptListActions
                            id={manuscript.id}
                            currentTitle={manuscript.title}
                            currentSource={manuscript.source || ''}
                            currentDescription={manuscript.description || ''}
                        />
                    </h1>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="rounded-full border border-border bg-card px-2.5 py-1">
                            Source : {manuscript.source || 'non renseignée'}
                        </span>
                        <span className="rounded-full border border-border bg-card px-2.5 py-1">
                            Progression : {progressPct}%
                        </span>
                    </div>
                    {manuscript.description && <p className="max-w-3xl text-muted-foreground">{manuscript.description}</p>}
                    <div className="mt-4 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="rounded-xl border border-border bg-card p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Validées</p>
                            <p className="mt-1 text-2xl font-bold text-green-700">{validatedLines}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-card p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">À revoir</p>
                            <p className="mt-1 text-2xl font-bold text-amber-700">{reviewCount}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-card p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Conflits</p>
                            <p className="mt-1 text-2xl font-bold text-destructive">{conflictCount}</p>
                        </div>
                    </div>
                    <div className="mt-2 max-w-sm flex flex-col gap-3">
                        <ReferenceTextUpload manuscriptId={manuscript.id} currentUrl={manuscript.reference_text_url} />
                        <PdfUpload manuscriptId={manuscript.id} currentUrl={manuscript.pdf_url} />
                    </div>
                </div>
                <div className="flex flex-wrap items-start gap-3">
                    <Link
                        href={`/corpus/${manuscript.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 font-medium shadow-sm transition-colors hover:bg-muted"
                    >
                        <ExternalLink className="h-4 w-4" /> Notice publique
                    </Link>
                    <BulkUploadPagesModal manuscriptId={manuscript.id} currentMaxOrder={pages.length > 0 ? Math.max(...pages.map((p: any) => p.order_index)) : 0} />
                    <Link
                        href={`/admin/manuscripts/${manuscript.id}/pages/new`}
                        className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md transition-colors shadow-sm font-medium"
                    >
                        + Ajouter une page
                    </Link>
                    {conflictCount > 0 && (
                        <Link
                            href="/admin/verify"
                            className="inline-flex items-center gap-2 bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 px-4 py-2 rounded-md transition-colors shadow-sm font-medium"
                        >
                            Examiner {conflictCount} conflit{conflictCount !== 1 ? 's' : ''}
                        </Link>
                    )}
                </div>
            </div>

            <section className="grid gap-6 border-y border-border py-6 lg:grid-cols-[220px_1fr]">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Préparation scientifique</p>
                    <div className="mt-3 flex items-end gap-2">
                        <span className="text-4xl font-semibold tabular-nums text-secondary">{scholarlyScore}%</span>
                        <span className="pb-1 text-sm text-muted-foreground">de complétude</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-secondary" style={{ width: `${scholarlyScore}%` }} />
                    </div>
                </div>
                <div>
                    <p className="text-sm leading-6 text-muted-foreground">
                        Cette liste contrôle les éléments nécessaires pour qu’une notice soit compréhensible, citable et exploitable par une équipe universitaire.
                    </p>
                    <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {scholarlyChecks.map((check) => (
                            <li key={check.label} className="flex items-center gap-2 text-sm">
                                {check.complete ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-700" /> : <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />}
                                <span className={check.complete ? 'text-foreground' : 'text-muted-foreground'}>{check.label}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">

                {pages.map((page: any) => {
                    const lineCount = page.segments?.length || 0
                    const validatedLines = page.segments?.filter((s: any) => s.status === 'validated').length || 0
                    const conflicts = page.segments?.filter((s: any) => s.status === 'conflict').length || 0

                    return (
                        <Link key={page.id} href={`/admin/manuscripts/${manuscript.id}/pages/${page.id}`}>
                            <div className="bg-card border border-border shadow-sm rounded-lg overflow-hidden hover:ring-2 hover:ring-primary/20 transition-all group">
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
                                            {conflicts} CONFLIT{conflicts > 1 ? 'S' : ''}
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 flex flex-col gap-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-medium text-foreground">{lineCount} lignes</span>
                                        <span className="text-muted-foreground text-xs">{validatedLines} / {lineCount} validées</span>
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
                        <p className="font-medium">Aucune page n’a encore été ajoutée.</p>
                        <p className="text-sm">Utilisez « Ajouter une page » pour importer le premier scan complet.</p>
                    </div>
                )}
            </div>

        </div>
    )
}
