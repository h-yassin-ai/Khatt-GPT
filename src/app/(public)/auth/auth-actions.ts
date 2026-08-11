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
        redirect('/auth/login?error=auth_failed')
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    // Honeypot check
    const honeypot = formData.get('website')
    if (honeypot) {
        console.warn('Honeypot filled - potential bot detected')
        redirect('/auth/register?error=auth_spam')
    }

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        username: formData.get('username') as string,
    }

    // Check if username exists by querying profiles table (via a service/anon client since profiles are public reading)
    const { data: profileCheck } = await supabase.from('profiles').select('id').eq('username', data.username).single()

    if (profileCheck) {
        redirect('/auth/register?error=username_taken')
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
        let errorMessage = error.message
        if (errorMessage.toLowerCase().includes('database error') || errorMessage.toLowerCase().includes('plugin') || errorMessage.toLowerCase().includes('function')) {
            errorMessage = 'auth_database'
        }
        console.error('Signup error:', error)
        redirect(`/auth/register?error=${encodeURIComponent(errorMessage)}`)
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}
