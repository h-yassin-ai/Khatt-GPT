import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';

export default async function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return (
        <div className="min-h-screen flex flex-col items-center">
            {/* Navigation */}
            <header className="w-full max-w-7xl px-6 py-6 flex justify-between items-center z-10 sticky top-0 bg-background/80 backdrop-blur-md border-b border-border">
                <div className="flex items-center gap-2">
                    {/* Custom logo icon or text */}
                    <span className="font-heading text-3xl font-bold tracking-tight text-primary">وراقة</span>
                    <span className="font-heading text-2xl font-semibold ml-2">Waraka</span>
                </div>
                <nav className="flex items-center gap-6">
                    {user ? (
                        <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
                            Dashboard
                        </Link>
                    ) : (
                        <>
                            <Link href="/auth/login" className="text-sm font-medium hover:text-primary transition-colors">
                                Log In
                            </Link>
                            <Link
                                href="/auth/register"
                                className="text-sm font-medium bg-primary text-primary-foreground px-5 py-2.5 rounded-md hover:bg-primary/90 transition-all shadow-sm"
                            >
                                Start Contributing
                            </Link>
                        </>
                    )}
                </nav>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-7xl">
                {children}
            </main>

            {/* Footer */}
            <footer className="w-full max-w-7xl p-6 text-center text-sm text-muted-foreground border-t border-border mt-16">
                <p>© {new Date().getFullYear()} Waraka. Preserving Maghrebi Manuscripts.</p>
            </footer>
        </div>
    );
}
