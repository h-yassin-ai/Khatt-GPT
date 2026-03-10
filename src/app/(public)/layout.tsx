import { createClient } from '@/utils/supabase/server';
import { ContributorNav } from '@/components/ContributorNav';
import Link from 'next/link';

export default async function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
    const isAdmin = user?.email ? adminEmails.includes(user.email) : false;

    return (
        <div className="min-h-screen flex flex-col items-center">
            {/* Navigation */}
            <header className="w-full border-b border-border bg-background/95 backdrop-blur sticky top-0 z-40">
                {user ? (
                    <ContributorNav email={user.email ?? ''} isAdmin={isAdmin} />
                ) : (
                    <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center w-full">
                        <div className="flex items-center gap-2">
                            <span className="font-heading text-3xl font-bold tracking-tight text-primary">وراقة</span>
                            <span className="font-heading text-2xl font-semibold ml-2">Khatt-GPT</span>
                        </div>
                        <nav className="flex items-center gap-6">
                            <Link href="/auth/login" className="text-sm font-medium hover:text-primary transition-colors">
                                Log In
                            </Link>
                            <Link
                                href="/auth/register"
                                className="text-sm font-medium bg-primary text-primary-foreground px-5 py-2.5 rounded-md hover:bg-primary/90 transition-all shadow-sm"
                            >
                                Start Contributing
                            </Link>
                        </nav>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-7xl">
                {children}
            </main>

            {/* Footer */}
            <footer className="w-full max-w-7xl p-6 text-center text-sm text-muted-foreground border-t border-border mt-16">
                <p>© {new Date().getFullYear()} Khatt-GPT. Preserving Maghrebi Manuscripts.</p>
            </footer>
        </div>
    );
}
