'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createManuscriptRecord } from '../actions'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { ChevronLeft, FolderOpen, FileImage, LineChart } from 'lucide-react'

export default function NewManuscriptPage() {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [source, setSource] = useState('')
    const [pdfUrl, setPdfUrl] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const router = useRouter()
    const { toast } = useToast()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) return

        setSubmitting(true)

        const result = await createManuscriptRecord({
            title: title.trim(),
            description: description.trim(),
            source: source.trim(),
            segmentsCount: 0,
            coverUrl: '',
            pdfUrl: pdfUrl.trim()
        })

        if (result.error) {
            toast({ title: "Error", description: result.error, variant: "destructive" })
            setSubmitting(false)
            return
        }

        toast({ title: "Project created!", description: "Now add pages to your manuscript." })
        router.push(`/admin/manuscripts/${result.id}`)
        router.refresh()
    }

    return (
        <div className="max-w-2xl mx-auto py-10 flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <Link href="/admin/manuscripts" className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2">
                    <ChevronLeft className="w-4 h-4" /> Back to Manuscripts
                </Link>
                <h1 className="text-3xl font-heading font-semibold">Create New Project</h1>
                <p className="text-muted-foreground">A project (manuscript) is the top-level container. After creating it, you can add pages and then upload line images to each page.</p>
            </div>

            {/* How it works guide */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { step: "1", icon: FolderOpen, label: "Create Project", desc: "Name your manuscript" },
                    { step: "2", icon: FileImage, label: "Add Pages", desc: "Upload full-page scans" },
                    { step: "3", icon: LineChart, label: "Upload Lines", desc: "Batch upload line images" },
                ].map(item => (
                    <div key={item.step} className="flex flex-col items-center text-center gap-2 p-4 rounded-xl bg-primary/5 border border-primary/10">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-sm">
                            {item.step}
                        </div>
                        <item.icon className="w-5 h-5 text-primary/70" />
                        <span className="font-medium text-sm">{item.label}</span>
                        <span className="text-xs text-muted-foreground">{item.desc}</span>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="bg-card border border-border p-8 rounded-xl shadow-sm flex flex-col gap-6">
                <h2 className="font-semibold text-lg border-b border-border pb-2">Step 1 — Project Details</h2>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Title <span className="text-destructive">*</span></label>
                    <input
                        required
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                        placeholder="e.g. Kitāb al-Shifāʾ"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Source / Collection</label>
                    <input
                        value={source}
                        onChange={e => setSource(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                        placeholder="e.g. National Library of Morocco"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                        rows={3}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none resize-y"
                        placeholder="Historical context or notes about this manuscript..."
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">PDF URL (Storage or External)</label>
                    <input
                        value={pdfUrl}
                        onChange={e => setPdfUrl(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                        placeholder="https://.../manuscript.pdf"
                    />
                    <p className="text-[10px] text-muted-foreground italic">If provided, contributors will see a PDF panel during transcription.</p>
                </div>

                <Button type="submit" disabled={submitting || !title.trim()} className="w-full h-12 text-base">
                    {submitting ? 'Creating...' : 'Create Project & Add Pages →'}
                </Button>
            </form>
        </div>
    )
}
