import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ContributorNav } from '@/components/ContributorNav'

export default async function ContributorLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || []
    const isAdmin = user.email ? adminEmails.includes(user.email) : false

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur">
                <ContributorNav email={user.email ?? ''} isAdmin={isAdmin} />
            </header>

            <main className="flex-1 w-full max-w-7xl mx-auto p-6">
                {children}
            </main>
        </div>
    )
}
