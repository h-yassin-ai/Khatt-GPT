'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { deleteManuscript } from './actions'
import { useToast } from '@/hooks/use-toast'

export default function ManuscriptListActions({ id }: { id: string }) {
    const [deleting, setDeleting] = useState(false)
    const router = useRouter()
    const { toast } = useToast()

    const handleDelete = async () => {
        if (!confirm('Delete this manuscript and ALL its pages and lines? This is irreversible.')) return
        setDeleting(true)
        const res = await deleteManuscript(id)
        if (res?.error) {
            toast({ title: 'Error', description: res.error, variant: 'destructive' })
            setDeleting(false)
        } else {
            toast({ title: 'Manuscript deleted.' })
            router.refresh()
        }
    }

    return (
        <button
            onClick={handleDelete}
            disabled={deleting}
            title="Delete manuscript"
            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors disabled:opacity-40"
        >
            <Trash2 className="w-4 h-4" />
        </button>
    )
}
