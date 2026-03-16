'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

async function assertAdmin(supabase: any) {
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user?.email) return { ok: false, error: 'Unauthorized' }

    const adminEmails = (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map((email) => email.trim())
        .filter(Boolean)

    const userEmail = user.email.toLowerCase()
    if (!adminEmails.map(e => e.toLowerCase()).includes(userEmail)) {
        return { ok: false, error: `Admin access required` }
    }

    return { ok: true }
}

async function getAdminClient() {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { createClient: createAdminClient } = await import('@supabase/supabase-js')
        return createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        )
    }
    return await createClient()
}

export async function getUsers() {
    const supabase = await createClient()
    const adminCheck = await assertAdmin(supabase)
    if (!adminCheck.ok) throw new Error(adminCheck.error)

    const adminSupabase = await getAdminClient()
    const { data: profiles, error } = await adminSupabase
        .from('profiles')
        .select('*')
        .order('total_contributions', { ascending: false })

    if (error) throw new Error(error.message)
    return profiles
}

export async function toggleUserSuspension(userId: string, isSuspended: boolean) {
    const supabase = await createClient()
    const adminCheck = await assertAdmin(supabase)
    if (!adminCheck.ok) return { error: adminCheck.error }

    const adminSupabase = await getAdminClient()
    const { error } = await adminSupabase
        .from('profiles')
        .update({ is_suspended: isSuspended })
        .eq('id', userId)

    if (error) return { error: error.message }

    revalidatePath('/admin/users')
    return { success: true }
}
