import { createClient } from '@/utils/supabase/server'
import { Download, FileJson, Database, FileArchive } from 'lucide-react'

export default async function ExportPage() {
    const supabase = await createClient()

    // For the export, we just show stats and provide a download link
    // The actual heavy lifting of JSON generation is best done via a Route Handler (e.g. /api/export)

    const { count: validatedCount } = await supabase
        .from('transcriptions')
        .select('*', { count: 'exact', head: true })
        .eq('is_validated', true)

    const { count: pendingCount } = await supabase
        .from('transcriptions')
        .select('*', { count: 'exact', head: true })
        .eq('is_validated', false)

    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-8 py-6">
            <div>
                <h1 className="text-3xl font-heading font-semibold text-foreground mb-2">Dataset Export</h1>
                <p className="text-muted-foreground">Download the structured transcription dataset for AI training.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* JSON Export Card */}
                <div className="bg-card border border-border shadow-sm rounded-xl p-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                        <FileJson className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-heading font-semibold mb-2">JSON Format</h2>
                    <p className="text-sm text-muted-foreground mb-8">
                        Export a clean JSON array containing `{"{"} &quot;image_url&quot;: &quot;...&quot;, &quot;text&quot;: &quot;...&quot; {"}"}`
                        pairs for all <strong className="text-success">{validatedCount || 0}</strong> validated segments.
                    </p>

                    <a
                        href="/api/export"
                        download="waraka_dataset.json"
                        className="bg-primary text-primary-foreground w-full py-3 rounded-md font-semibold shadow flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                    >
                        <Download className="w-5 h-5" /> Download Dataset
                    </a>
                </div>

                {/* ZIP Export Card */}
                <div className="bg-card border border-border shadow-sm rounded-xl p-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                        <FileArchive className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-heading font-semibold mb-2">ZIP Format</h2>
                    <p className="text-sm text-muted-foreground mb-8">
                        Export a HuggingFace Dataset compatible ZIP archive containing the cropped segment <strong className="text-foreground">images/</strong> and a <strong className="text-foreground">metadata.jsonl</strong> file.
                    </p>

                    <a
                        href="/api/export?format=zip"
                        className="bg-blue-600 text-white w-full py-3 rounded-md font-semibold shadow flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors mt-auto"
                    >
                        <Download className="w-5 h-5" /> Download ZIP
                    </a>
                </div>

                {/* Stats Card */}
                <div className="bg-gradient-to-br from-[#FAF7F2] to-[#E8DFD0] border border-border shadow-inner rounded-xl p-8 flex flex-col justify-center">
                    <h2 className="text-lg font-semibold tracking-tight mb-6 flex items-center gap-2">
                        <Database className="w-5 h-5 text-primary" /> Export Readiness
                    </h2>

                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                            <span className="text-sm font-medium text-muted-foreground">Validated Pairs</span>
                            <span className="font-mono font-bold text-success text-lg">{validatedCount || 0}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border/50">
                            <span className="text-sm font-medium text-muted-foreground">Pending Review</span>
                            <span className="font-mono font-bold text-warning text-lg">{pendingCount || 0}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-sm font-medium text-muted-foreground">Total Transcriptions</span>
                            <span className="font-mono font-bold text-foreground text-lg">{(validatedCount || 0) + (pendingCount || 0)}</span>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-border/50 text-center">
                        <a href="/admin/export/history" className="text-sm font-medium text-primary hover:underline">
                            View Export History
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
