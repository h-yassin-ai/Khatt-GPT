import { createClient } from '@/utils/supabase/server';
import { ContributorNav } from '@/components/ContributorNav';
import { PublicHeader } from '@/components/PublicHeader';
import { PublicFooter } from '@/components/PublicFooter';
import { cookies } from 'next/headers';

const USER_LOOKUP_TIMEOUT_MS = 1200;

async function getOptionalUser() {
    const cookieStore = await cookies();
    const hasAuthCookie = cookieStore.getAll().some(({ name }) => name.startsWith('sb-') && name.includes('auth-token'));
    if (!hasAuthCookie) return null;

    const supabase = await createClient();
    try {
        const result = await Promise.race([
            supabase.auth.getUser(),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), USER_LOOKUP_TIMEOUT_MS)),
        ]);
        return result && 'data' in result ? result.data.user : null;
    } catch {
        return null;
    }
}

export default async function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getOptionalUser();
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
    const isAdmin = user?.email ? adminEmails.includes(user.email) : false;

    return (
        <div className="min-h-screen flex flex-col items-center">
            {/* Navigation */}
            <header className="w-full border-b border-border bg-background/95 backdrop-blur sticky top-0 z-40">
                {user ? (
                    <ContributorNav email={user.email ?? ''} isAdmin={isAdmin} />
                ) : (
                    <PublicHeader />
                )}
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-7xl">
                {children}
            </main>

            <PublicFooter year={new Date().getFullYear()} />
        </div>
    );
}
