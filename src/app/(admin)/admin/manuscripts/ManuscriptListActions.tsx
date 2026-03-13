"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Edit2 } from 'lucide-react'
import { deleteManuscript, updateManuscriptTitle } from './actions'
import { useToast } from '@/hooks/use-toast'

export default function ManuscriptListActions({ id, currentTitle }: { id: string, currentTitle: string }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const { toast } = useToast()

    const handleEditTitle = async () => {
        const newTitle = prompt('Enter new title for the manuscript:', currentTitle)
        if (!newTitle || newTitle === currentTitle) return

        setLoading(true)
        const res = await updateManuscriptTitle(id, newTitle)
        if (res?.error) {
            toast({ title: 'Error', description: res.error, variant: 'destructive' })
            setLoading(false)
        } else {
            toast({ title: 'Manuscript updated.' })
            router.refresh()
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Delete this manuscript and ALL its pages and lines? This is irreversible.')) return
        setLoading(true)
        const res = await deleteManuscript(id)
        if (res?.error) {
            toast({ title: 'Error', description: res.error, variant: 'destructive' })
            setLoading(false)
        } else {
            toast({ title: 'Manuscript deleted.' })
            router.refresh()
        }
    }

    return (
        <div className="flex items-center gap-1">
            <button
                onClick={handleEditTitle}
                disabled={loading}
                title="Edit title"
                className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors disabled:opacity-40"
            >
                <Edit2 className="w-4 h-4" />
            </button>
            <button
                onClick={handleDelete}
                disabled={loading}
                title="Delete manuscript"
                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors disabled:opacity-40"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    )
}
