"use client"

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Edit2, Loader2, Trash2 } from 'lucide-react'
import { deleteManuscript, updateManuscriptMetadata } from './actions'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

export default function ManuscriptListActions({
    id,
    currentTitle,
    currentSource = '',
    currentDescription = '',
}: {
    id: string
    currentTitle: string
    currentSource?: string
    currentDescription?: string
}) {
    const [open, setOpen] = useState(false)
    const [title, setTitle] = useState(currentTitle)
    const [source, setSource] = useState(currentSource)
    const [description, setDescription] = useState(currentDescription)
    const [loadingDelete, setLoadingDelete] = useState(false)
    const [isPending, startTransition] = useTransition()
    const router = useRouter()
    const { toast } = useToast()

    const resetForm = () => {
        setTitle(currentTitle)
        setSource(currentSource)
        setDescription(currentDescription)
    }

    const handleSave = () => {
        if (!title.trim()) {
            toast({ title: 'Titre requis', description: 'Le livre doit avoir un titre.', variant: 'destructive' })
            return
        }

        startTransition(async () => {
            const res = await updateManuscriptMetadata(id, {
                title,
                source,
                description,
            })

            if (res?.error) {
                toast({ title: 'Erreur', description: res.error, variant: 'destructive' })
                return
            }

            toast({ title: 'Livre mis à jour', description: 'Les métadonnées ont été enregistrées.' })
            setOpen(false)
            router.refresh()
        })
    }

    const handleDelete = async () => {
        if (!confirm('Supprimer ce livre, toutes ses pages et toutes ses lignes ? Cette action est irréversible.')) return
        setLoadingDelete(true)
        const res = await deleteManuscript(id)
        if (res?.error) {
            toast({ title: 'Erreur', description: res.error, variant: 'destructive' })
            setLoadingDelete(false)
        } else {
            toast({ title: 'Livre supprimé' })
            router.refresh()
        }
    }

    return (
        <>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => setOpen(true)}
                    disabled={isPending || loadingDelete}
                    title="Modifier les métadonnées"
                    className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-40"
                >
                    <Edit2 className="h-4 w-4" />
                </button>
                <button
                    onClick={handleDelete}
                    disabled={isPending || loadingDelete}
                    title="Supprimer le livre"
                    className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                >
                    {loadingDelete ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
            </div>

            <Dialog open={open} onOpenChange={(next) => {
                setOpen(next)
                if (!next) resetForm()
            }}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Modifier le livre</DialogTitle>
                        <DialogDescription>
                            Ces informations aident les contributeurs et les vérificateurs à comprendre le corpus.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Titre</label>
                            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Source / collection</label>
                            <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Bibliothèque, collection, cote..." />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Contexte, folios, type d'écriture, consignes de transcription..."
                                className="min-h-28"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                            Annuler
                        </Button>
                        <Button onClick={handleSave} disabled={isPending}>
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Enregistrer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
