"use client"

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Edit2, Loader2, Trash2 } from 'lucide-react'
import { deleteManuscript, updateManuscriptMetadata } from './actions'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useLanguage } from '@/lib/language-context'
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
    const { t, lang } = useLanguage()

    const resetForm = () => {
        setTitle(currentTitle)
        setSource(currentSource)
        setDescription(currentDescription)
    }

    const handleSave = () => {
        if (!title.trim()) {
            toast({ title: t('admin.title_required'), description: t('admin.book_needs_title'), variant: 'destructive' })
            return
        }

        startTransition(async () => {
            const res = await updateManuscriptMetadata(id, {
                title,
                source,
                description,
            })

            if (res?.error) {
                toast({ title: t('common.error'), description: res.error, variant: 'destructive' })
                return
            }

            toast({ title: t('admin.book_updated'), description: t('admin.metadata_saved') })
            setOpen(false)
            router.refresh()
        })
    }

    const handleDelete = async () => {
        if (!confirm(t('admin.delete_book_confirm'))) return
        setLoadingDelete(true)
        const res = await deleteManuscript(id)
        if (res?.error) {
            toast({ title: t('common.error'), description: res.error, variant: 'destructive' })
            setLoadingDelete(false)
        } else {
            toast({ title: t('admin.book_deleted') })
            router.refresh()
        }
    }

    return (
        <>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => setOpen(true)}
                    disabled={isPending || loadingDelete}
                    title={t('admin.edit_metadata')}
                    className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-40"
                >
                    <Edit2 className="h-4 w-4" />
                </button>
                <button
                    onClick={handleDelete}
                    disabled={isPending || loadingDelete}
                    title={t('admin.delete_book')}
                    className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                >
                    {loadingDelete ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
            </div>

            <Dialog open={open} onOpenChange={(next) => {
                setOpen(next)
                if (!next) resetForm()
            }}>
                <DialogContent className="sm:max-w-lg" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                    <DialogHeader>
                        <DialogTitle>{t('admin.edit_book')}</DialogTitle>
                        <DialogDescription>
                            {t('admin.metadata_help')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('admin.title')}</label>
                            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('admin.source_collection')}</label>
                            <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder={t('admin.source_placeholder')} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('admin.description')}</label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder={t('admin.description_placeholder')}
                                className="min-h-28"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                            {t('admin.cancel')}
                        </Button>
                        <Button onClick={handleSave} disabled={isPending}>
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {t('admin.save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
