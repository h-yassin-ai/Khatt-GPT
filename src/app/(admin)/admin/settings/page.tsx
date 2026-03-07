import { createClient } from '@/utils/supabase/server'
import WebhookSettingsClient from './WebhookSettingsClient'
import { Settings } from 'lucide-react'

export default async function SettingsPage() {
    const supabase = await createClient()

    const { data: webhooks, error } = await supabase
        .from('webhooks')
        .select('*')
        .order('created_at', { ascending: true })

    if (error) {
        console.error("Failed to fetch webhooks:", error)
    }

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Settings className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-heading font-semibold text-foreground">Platform Settings</h1>
                    <p className="text-muted-foreground">Manage administrative configurations and integrations.</p>
                </div>
            </div>

            {/* Webhook Settings Section */}
            <WebhookSettingsClient initialWebhooks={webhooks || []} />

        </div>
    )
}
