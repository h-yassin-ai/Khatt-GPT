'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addWebhook(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Unauthenticated" }

    const url = formData.get('url') as string
    const secret = formData.get('secret') as string

    if (!url) return { error: "URL is required" }

    const { error } = await supabase.from('webhooks').insert({
        url,
        secret: secret || null,
        is_active: true
    })

    if (error) return { error: error.message }
    revalidatePath('/admin/settings')
    return { success: true }
}

export async function toggleWebhook(id: string, currentState: boolean) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Unauthenticated" }

    const { error } = await supabase.from('webhooks').update({ is_active: !currentState }).eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/settings')
    return { success: true }
}

export async function deleteWebhook(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Unauthenticated" }

    const { error } = await supabase.from('webhooks').delete().eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/admin/settings')
    return { success: true }
}
