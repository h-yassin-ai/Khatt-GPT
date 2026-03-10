import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { LayoutDashboard, Library, Download, LogOut, PieChart, Search, Settings, CheckCircle } from 'lucide-react'
import { AdminRealtimeAlerts } from './AdminRealtimeAlerts'

// This layout relies on middleware.ts doing the heavy lifting of admin authorization
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/auth/login')

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <AdminRealtimeAlerts />

            {/* Sidebar */}
            <aside className="w-64 border-r border-border bg-card/50 flex flex-col">
                <div className="h-16 flex items-center px-6 border-b border-border">
                    <img src="/logo.png" alt="Khatt-GPT Logo" className="w-8 h-8 object-contain drop-shadow-[0_0_8px_rgba(255,193,7,0.4)]" />
                    <span className="font-heading text-lg lg:text-xl font-bold tracking-tight ml-2">Khatt-Admin</span>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2">
                    <Link href="/admin" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted text-foreground/80 hover:text-foreground">
                        <LayoutDashboard className="w-4 h-4" /> Overview
                    </Link>
                    <Link href="/admin/manuscripts" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted text-foreground/80 hover:text-foreground">
                        <Library className="w-4 h-4" /> Manuscripts
                    </Link>
                    <Link href="/admin/verify" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted text-foreground/80 hover:text-foreground">
                        <CheckCircle className="w-4 h-4" /> Verification
                    </Link>
                    <Link href="/admin/search" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted text-foreground/80 hover:text-foreground">
                        <Search className="w-4 h-4" /> Search
                    </Link>
                    <Link href="/admin/analytics" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted text-foreground/80 hover:text-foreground">
                        <PieChart className="w-4 h-4" /> Analytics
                    </Link>
                    <Link href="/admin/export" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted text-foreground/80 hover:text-foreground">
                        <Download className="w-4 h-4" /> Export Dataset
                    </Link>
                    <Link href="/admin/settings" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted text-foreground/80 hover:text-foreground">
                        <Settings className="w-4 h-4" /> Settings
                    </Link>
                </nav>

                <div className="p-4 border-t border-border">
                    <form action="/auth/signout" method="post">
                        <button className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted text-muted-foreground w-full text-left">
                            <LogOut className="w-4 h-4" /> Sign out
                        </button>
                    </form>
                    <div className="text-xs text-muted-foreground px-3 pt-4 mt-2 border-t border-border/50 truncate">
                        {user.email}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="p-8 max-w-7xl mx-auto block w-full h-full">
                    {children}
                </div>
            </main>
        </div>
    )
}
