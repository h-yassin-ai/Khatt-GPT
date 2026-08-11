import { createClient } from '@/utils/supabase/server'
import { AlertTriangle, Library, FileText, CheckCircle } from 'lucide-react'
import { getServerLanguage, translateServer } from '@/lib/server-i18n'

// Manual Card Components if shadcn cards are missing
function SimpleCard({ title, value, subtitle, icon: Icon, href }: any) {
    const content = (
        <div className="bg-card border border-border shadow-sm rounded-xl p-6 flex flex-col h-full hover:border-primary/50 transition-colors">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-sm font-medium text-muted-foreground tracking-tight">{title}</h3>
                <Icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-sans font-bold text-foreground mb-1">{value}</div>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
    )

    if (href) {
        return (
            <a href={href} className="block no-underline">
                {content}
            </a>
        )
    }

    return content
}

export default async function AdminOverviewPage() {
    const supabase = await createClient()
    const language = await getServerLanguage()
    const tx = (key: string, vars?: Record<string, string | number>) => translateServer(key, language, vars)

    // KPIs
    const { count: manuscriptsCount } = await supabase.from('manuscripts').select('*', { count: 'exact', head: true })
    const { count: segmentsCount } = await supabase.from('segments').select('*', { count: 'exact', head: true })
    const { count: validatedSegmentsCount } = await supabase.from('segments').select('*', { count: 'exact', head: true }).eq('status', 'validated')
    const { count: reviewSegmentsCount } = await supabase.from('segments').select('*', { count: 'exact', head: true }).neq('status', 'validated').gt('transcription_count', 0)
    const { count: conflictSegmentsCount } = await supabase.from('segments').select('*', { count: 'exact', head: true }).in('status', ['conflict', 'flagged'])
    const { count: transcriptionsCount } = await supabase.from('transcriptions').select('*', { count: 'exact', head: true })
    const { count: contributorsCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })

    // Active contributors (last 7 days simulation based on total for now)
    const { data: topContributors } = await supabase
        .from('profiles')
        .select('username, display_name, total_contributions')
        .order('total_contributions', { ascending: false })
        .limit(5)

    // Recent Manuscripts
    const { data: recentManuscripts } = await supabase
        .from('manuscripts')
        .select('id, title, total_segments, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

    const pctValidated = segmentsCount && segmentsCount > 0
        ? Math.round((validatedSegmentsCount || 0) / segmentsCount * 100)
        : 0

    return (
        <div className="flex flex-col gap-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div>
                <h1 className="text-3xl font-heading font-semibold text-foreground">{tx('admin.overview_title')}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{tx('admin.overview_desc')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <SimpleCard
                    title={tx('admin.total_manuscripts')}
                    value={manuscriptsCount || 0}
                    subtitle={tx('admin.uploaded_volumes')}
                    icon={Library}
                    href="/admin/manuscripts"
                />
                <SimpleCard
                    title={tx('admin.total_segments')}
                    value={segmentsCount || 0}
                    subtitle={tx('admin.submitted_transcriptions', { count: (transcriptionsCount || 0).toLocaleString(language === 'ar' ? 'ar' : language === 'en' ? 'en' : 'fr-FR') })}
                    icon={FileText}
                />
                <SimpleCard
                    title={tx('admin.validated_lines')}
                    value={validatedSegmentsCount || 0}
                    subtitle={tx('admin.validated_corpus', { count: pctValidated })}
                    icon={CheckCircle}
                    href="/admin/verify"
                />
                <SimpleCard
                    title={tx('admin.review_queue')}
                    value={reviewSegmentsCount || 0}
                    subtitle={tx('admin.conflicts_reports', { count: conflictSegmentsCount || 0 })}
                    icon={AlertTriangle}
                    href="/admin/verify"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Top Contributors Table */}
                <div className="bg-card border border-border shadow-sm rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-4 text-foreground tracking-tight">
                        {tx('admin.top_contributors')} <span className="text-sm font-normal text-muted-foreground">({tx('admin.registered', { count: contributorsCount || 0 })})</span>
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-muted-foreground border-b border-border/50">
                                <tr>
                                    <th className="pb-3 font-medium">{tx('admin.user')}</th>
                                    <th className="pb-3 font-medium text-right">{tx('admin.contributions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {topContributors?.map((user) => (
                                    <tr key={user.username}>
                                        <td className="py-3 font-medium text-foreground">{user.display_name || user.username} <span className="text-xs text-muted-foreground ml-2">@{user.username}</span></td>
                                        <td className="py-3 text-right font-mono bg-muted/20 px-2 rounded">{user.total_contributions}</td>
                                    </tr>
                                ))}
                                {!topContributors?.length && (
                                    <tr>
                                        <td colSpan={2} className="py-4 text-center text-muted-foreground">{tx('admin.no_contributors')}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Manuscripts Table */}
                <div className="bg-card border border-border shadow-sm rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-4 text-foreground tracking-tight">{tx('admin.recent_manuscripts')}</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-muted-foreground border-b border-border/50">
                                <tr>
                                    <th className="pb-3 font-medium">{tx('admin.title')}</th>
                                    <th className="pb-3 font-medium text-right">{tx('admin.segments')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {recentManuscripts?.map((ms) => (
                                    <tr key={ms.id}>
                                        <td className="py-3 font-medium text-foreground truncate max-w-[200px]" title={ms.title}>{ms.title}</td>
                                        <td className="py-3 text-right">{ms.total_segments}</td>
                                    </tr>
                                ))}
                                {!recentManuscripts?.length && (
                                    <tr>
                                        <td colSpan={2} className="py-4 text-center text-muted-foreground">{tx('admin.no_manuscripts')}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    )
}

