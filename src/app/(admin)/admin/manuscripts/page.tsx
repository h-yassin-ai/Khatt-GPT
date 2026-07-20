import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, FileImage, Layers3, PlusCircle, ScrollText } from 'lucide-react'
import ManuscriptListActions from './ManuscriptListActions'

function StatCard({ label, value, icon: Icon, tone = 'default' }: {
    label: string
    value: number
    icon: any
    tone?: 'default' | 'success' | 'warning'
}) {
    const toneClass = tone === 'success'
        ? 'text-green-700 bg-green-500/10 border-green-500/20'
        : tone === 'warning'
            ? 'text-amber-700 bg-amber-500/10 border-amber-500/20'
            : 'text-primary bg-primary/10 border-primary/20'

    return (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                    <p className="mt-1 text-3xl font-bold text-foreground">{value.toLocaleString('fr-FR')}</p>
                </div>
                <div className={`rounded-lg border p-2.5 ${toneClass}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    )
}

export default async function ManuscriptsListPage() {
    const supabase = await createClient()

    const { data: manuscripts } = await supabase
        .from('manuscripts')
        .select(`
            id,
            title,
            description,
            source,
            created_at,
            cover_image_url,
            total_segments,
            segments ( id, status, transcription_count )
        `)
        .order('created_at', { ascending: false })

    const rows = (manuscripts || []).map((ms: any) => {
        const segments = ms.segments || []
        const total = segments.length || ms.total_segments || 0
        const validated = segments.filter((s: any) => s.status === 'validated').length
        const conflicts = segments.filter((s: any) => s.status === 'conflict' || s.status === 'flagged').length
        const toReview = segments.filter((s: any) =>
            s.status !== 'validated' && s.status !== 'archived' && (s.transcription_count || 0) > 0
        ).length
        const pending = Math.max(0, total - validated)
        const pct = total > 0 ? Math.round((validated / total) * 100) : 0

        return { ...ms, total, validated, conflicts, toReview, pending, pct }
    })

    const totalBooks = rows.length
    const totalSegments = rows.reduce((sum, ms) => sum + ms.total, 0)
    const totalValidated = rows.reduce((sum, ms) => sum + ms.validated, 0)
    const totalReview = rows.reduce((sum, ms) => sum + ms.toReview, 0)

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-3xl font-heading font-semibold text-foreground">Livres et manuscrits</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Ajoutez des corpus, corrigez leurs métadonnées et suivez la validation des lignes.
                    </p>
                </div>
                <Link
                    href="/admin/manuscripts/new"
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
                >
                    <PlusCircle className="h-4 w-4" /> Nouveau livre
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Livres" value={totalBooks} icon={ScrollText} />
                <StatCard label="Lignes importées" value={totalSegments} icon={Layers3} />
                <StatCard label="Lignes validées" value={totalValidated} icon={CheckCircle2} tone="success" />
                <StatCard label="À revoir" value={totalReview} icon={AlertTriangle} tone="warning" />
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <table className="w-full border-collapse text-left text-sm">
                    <thead className="border-b border-border bg-muted/50 text-muted-foreground">
                        <tr>
                            <th className="px-5 py-4 font-medium">Livre</th>
                            <th className="px-5 py-4 font-medium">Progression</th>
                            <th className="px-5 py-4 font-medium">Revue</th>
                            <th className="px-5 py-4 font-medium">Ajouté</th>
                            <th className="px-5 py-4 text-right font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {rows.map((ms) => {
                            const healthClass = ms.conflicts > 0
                                ? 'bg-destructive'
                                : ms.pct === 100 && ms.total > 0
                                    ? 'bg-green-500'
                                    : ms.toReview > 0
                                        ? 'bg-amber-500'
                                        : 'bg-muted-foreground'

                            return (
                                <tr key={ms.id} className="transition-colors hover:bg-muted/20">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-4">
                                            <Link href={`/admin/manuscripts/${ms.id}`} className="shrink-0">
                                                <div className="flex h-20 w-16 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                                                    {ms.cover_image_url ? (
                                                        <img src={ms.cover_image_url || undefined} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <FileImage className="h-6 w-6 text-muted-foreground/60" />
                                                    )}
                                                </div>
                                            </Link>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className={`h-2.5 w-2.5 rounded-full ${healthClass}`} />
                                                    <Link href={`/admin/manuscripts/${ms.id}`} className="font-semibold text-foreground hover:text-primary hover:underline">
                                                        {ms.title}
                                                    </Link>
                                                </div>
                                                <p className="mt-1 max-w-[360px] truncate text-xs text-muted-foreground">
                                                    {ms.source || 'Source non renseignée'}
                                                </p>
                                                {ms.description && (
                                                    <p className="mt-1 max-w-[420px] truncate text-xs text-muted-foreground/80">
                                                        {ms.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="w-56 space-y-2">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground">{ms.validated} / {ms.total} validées</span>
                                                <span className="font-semibold text-foreground">{ms.pct}%</span>
                                            </div>
                                            <div className="h-2 overflow-hidden rounded-full bg-muted">
                                                <div className="h-full rounded-full bg-primary" style={{ width: `${ms.pct}%` }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex flex-wrap gap-2">
                                            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-700">
                                                {ms.toReview} à revoir
                                            </span>
                                            {ms.conflicts > 0 && (
                                                <span className="rounded-full border border-destructive/20 bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive">
                                                    {ms.conflicts} conflit{ms.conflicts > 1 ? 's' : ''}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                                        {new Date(ms.created_at).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/admin/manuscripts/${ms.id}`}
                                                className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
                                            >
                                                Ouvrir
                                            </Link>
                                            <ManuscriptListActions
                                                id={ms.id}
                                                currentTitle={ms.title}
                                                currentSource={ms.source || ''}
                                                currentDescription={ms.description || ''}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-16 text-center text-muted-foreground">
                                    Aucun livre importé pour le moment.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
