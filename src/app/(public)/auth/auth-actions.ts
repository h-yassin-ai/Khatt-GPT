'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    // type-casting here for convenience
    // in practice, you should validate your inputs
    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        redirect('/auth/login?error=Could not authenticate user')
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        username: formData.get('username') as string,
    }

    // Check if username exists by querying profiles table (via a service/anon client since profiles are public reading)
    const { data: profileCheck } = await supabase.from('profiles').select('id').eq('username', data.username).single()

    if (profileCheck) {
        redirect('/auth/register?error=Username already taken')
    }

    const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
            data: {
                username: data.username,
            }
        }
    })

    if (error) {
        redirect(`/auth/register?error=${encodeURIComponent(error.message)}`)
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}
