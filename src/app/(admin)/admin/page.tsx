import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card" // Assuming manual Card exists, I'll build a simple wrapper next if missing
import { Library, Users, FileText, CheckCircle } from 'lucide-react'

// Manual Card Components if shadcn cards are missing
function SimpleCard({ title, value, subtitle, icon: Icon }: any) {
    return (
        <div className="bg-card border border-border shadow-sm rounded-xl p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-sm font-medium text-muted-foreground tracking-tight">{title}</h3>
                <Icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-sans font-bold text-foreground mb-1">{value}</div>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
    )
}

export default async function AdminOverviewPage() {
    const supabase = await createClient()

    // KPIs
    const { count: manuscriptsCount } = await supabase.from('manuscripts').select('*', { count: 'exact', head: true })
    const { count: segmentsCount } = await supabase.from('segments').select('*', { count: 'exact', head: true })
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

    const pctTranscribed = segmentsCount && segmentsCount > 0
        ? Math.round((transcriptionsCount || 0) / segmentsCount * 100)
        : 0

    return (
        <div className="flex flex-col gap-8">
            <h1 className="text-3xl font-heading font-semibold text-foreground">Platform Overview</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <SimpleCard
                    title="Total Manuscripts"
                    value={manuscriptsCount || 0}
                    subtitle="Uploaded volumes"
                    icon={Library}
                />
                <SimpleCard
                    title="Total Segments"
                    value={segmentsCount || 0}
                    subtitle="Image slices available"
                    icon={FileText}
                />
                <SimpleCard
                    title="Transcriptions"
                    value={transcriptionsCount || 0}
                    subtitle={`${pctTranscribed}% coverage est.`}
                    icon={CheckCircle}
                />
                <SimpleCard
                    title="Contributors"
                    value={contributorsCount || 0}
                    subtitle="Registered users"
                    icon={Users}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Top Contributors Table */}
                <div className="bg-card border border-border shadow-sm rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-4 text-foreground tracking-tight">Top Contributors</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-muted-foreground border-b border-border/50">
                                <tr>
                                    <th className="pb-3 font-medium">User</th>
                                    <th className="pb-3 font-medium text-right">Contributions</th>
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
                                        <td colSpan={2} className="py-4 text-center text-muted-foreground">No contributors yet</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Manuscripts Table */}
                <div className="bg-card border border-border shadow-sm rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-4 text-foreground tracking-tight">Recent Manuscripts</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-muted-foreground border-b border-border/50">
                                <tr>
                                    <th className="pb-3 font-medium">Title</th>
                                    <th className="pb-3 font-medium text-right">Segments</th>
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
                                        <td colSpan={2} className="py-4 text-center text-muted-foreground">No manuscripts yet</td>
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

