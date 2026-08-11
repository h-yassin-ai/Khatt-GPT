'use client'

import { useState } from 'react'
import { Webhook, Plus, Trash2, Link as LinkIcon, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/lib/language-context'
import { addWebhook, toggleWebhook, deleteWebhook } from './actions'

type WebhookData = {
    id: string
    url: string
    secret: string | null
    is_active: boolean
    created_at: string
}

export default function WebhookSettingsClient({ initialWebhooks }: { initialWebhooks: WebhookData[] }) {
    const { toast } = useToast()
    const { t, lang } = useLanguage()
    const [webhooks, setWebhooks] = useState(initialWebhooks)
    const [isAdding, setIsAdding] = useState(false)

    async function handleAdd(formData: FormData) {
        setIsAdding(true)
        const res = await addWebhook(formData)
        if (res.error) {
            toast({ title: t('common.error'), description: res.error, variant: "destructive" })
        } else {
            toast({ title: t('admin.success'), description: t('admin.webhook_registered') })
            // We rely on Next.js revalidatePath which will refetch on the server,
            // but for a quicker local optimistic update we could refresh the page or rely on router.refresh()
            window.location.reload()
        }
        setIsAdding(false)
    }

    async function handleToggle(id: string, currentState: boolean) {
        const res = await toggleWebhook(id, currentState)
        if (res.error) {
            toast({ title: t('common.error'), description: res.error, variant: "destructive" })
        } else {
            setWebhooks(whs => whs.map(w => w.id === id ? { ...w, is_active: !currentState } : w))
        }
    }

    async function handleDelete(id: string) {
        if (!confirm(t('admin.delete_webhook_confirm'))) return
        const res = await deleteWebhook(id)
        if (res.error) {
            toast({ title: t('common.error'), description: res.error, variant: "destructive" })
        } else {
            setWebhooks(whs => whs.filter(w => w.id !== id))
            toast({ title: t('admin.deleted'), description: t('admin.webhook_deleted') })
        }
    }

    return (
        <div className="flex flex-col gap-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-3 mb-4 text-foreground">
                    <Webhook className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-heading font-semibold">{t('admin.webhooks_configured')}</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                    {t('admin.webhooks_desc')}
                </p>

                {webhooks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg border border-dashed border-border">
                        {t('admin.no_webhooks')}
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {webhooks.map((wh) => (
                            <div key={wh.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted/50 rounded-lg border border-border gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                                        <span className="font-mono text-sm font-medium text-foreground truncate block">{wh.url}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground ml-6">
                                        {wh.secret ? (
                                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                                <Shield className="w-3 h-3" /> {t('admin.secured')}
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-500">
                                                <Shield className="w-3 h-3" /> {t('admin.no_secret')}
                                            </span>
                                        )}
                                        <span>• {t('admin.created')} {new Date(wh.created_at).toLocaleDateString(lang === 'ar' ? 'ar' : lang === 'fr' ? 'fr-FR' : 'en-US')}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <Button
                                        variant={wh.is_active ? "outline" : "secondary"}
                                        size="sm"
                                        onClick={() => handleToggle(wh.id, wh.is_active)}
                                        className={wh.is_active ? "text-success border-success/30 hover:bg-success/10" : "text-muted-foreground"}
                                    >
                                        {wh.is_active ? t('admin.active') : t('admin.inactive')}
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(wh.id)} className="text-destructive hover:bg-destructive/10">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-primary" /> {t('admin.add_webhook')}
                </h3>
                <form action={handleAdd} className="flex flex-col gap-4 max-w-xl">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-foreground shrink-0">{t('admin.endpoint_url')}</label>
                        <input
                            type="url"
                            name="url"
                            required
                            placeholder="https://api.example.com/webhook"
                            className="bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-foreground shrink-0 flex gap-2">{t('admin.secret_token')} <span className="text-xs text-muted-foreground font-normal">({t('admin.optional')})</span></label>
                        <input
                            type="password"
                            name="secret"
                            placeholder={t('admin.secret_placeholder')}
                            className="bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                        />
                        <p className="text-xs text-muted-foreground">{t('admin.secret_hint')}</p>
                    </div>
                    <Button type="submit" disabled={isAdding} className="w-fit mt-2">
                        {isAdding ? t('admin.adding') : t('admin.register_webhook')}
                    </Button>
                </form>
            </div>
        </div>
    )
}
