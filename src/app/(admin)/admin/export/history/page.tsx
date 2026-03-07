import { createClient } from '@/utils/supabase/server'
import { FileArchive, FileJson, Clock, User } from 'lucide-react'

export default async function ExportHistoryPage() {
    const supabase = await createClient()

    const { data: logs, error } = await supabase
        .from('export_logs')
        .select(`
            id,
            format,
            record_count,
            exported_at,
            profiles:admin_id ( username )
        `)
        .order('exported_at', { ascending: false })
        .limit(100)

    if (error) {
        console.error("Failed to fetch export logs:", error)
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-heading font-semibold text-foreground mb-2">Export Logs</h1>
                <p className="text-muted-foreground">History of dataset exports by administrators.</p>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left relative">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                            <tr>
                                <th className="px-6 py-4 font-medium">Date & Time</th>
                                <th className="px-6 py-4 font-medium">Format</th>
                                <th className="px-6 py-4 font-medium text-right">Records</th>
                                <th className="px-6 py-4 font-medium">Exported By</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {!logs || logs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                                        No exports recorded yet.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                                        <td className="px-6 py-4 flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-muted-foreground" />
                                            {new Date(log.exported_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="flex items-center gap-2 font-medium">
                                                {log.format === 'zip' ? <FileArchive className="w-4 h-4 text-blue-500" /> : <FileJson className="w-4 h-4 text-primary" />}
                                                {log.format.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono font-medium">
                                            {log.record_count.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-muted-foreground" />
                                                {(log.profiles as any)?.username || 'Unknown Admin'}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
