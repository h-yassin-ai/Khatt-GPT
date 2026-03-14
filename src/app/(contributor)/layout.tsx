import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ContributorNav } from '@/components/ContributorNav'
import { headers } from 'next/headers'

export default async function ContributorLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const headersList = await headers()
    const pathname = headersList.get('x-pathname') || ''
    const isTranscribePage = pathname.includes('/transcribe')

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

            <main className={`flex-1 w-full p-6 ${isTranscribePage ? 'max-w-none' : 'max-w-7xl mx-auto'}`}>
                {children}
            </main>
        </div>
    )
}
