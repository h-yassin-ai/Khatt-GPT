import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Flame, Hexagon, BookOpen, PenTool, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getLevelProgress } from '@/lib/gamification'

// Simple hash utility to generate consistent colors for avatars based on username
function getAvatarColor(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 60%, 40%)`;
}

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    // Fetch user profile stats
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username, display_name, total_contributions, current_streak, points')
        .eq('id', user.id)
        .single()

    // Fetch pending platform segments count
    const { count: pendingCount } = await supabase
        .from('segments')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'validated')

    // Fetch recent user transcriptions
    const { data: recentTranscriptions } = await supabase
        .from('transcriptions')
        .select(`
      id,
      text,
      submitted_at,
      segments (
        image_url,
        manuscripts ( title )
      )
    `)
        .eq('contributor_id', user.id)
        .order('submitted_at', { ascending: false })
        .limit(3)

    // Fetch leaderboard
    const { data: leaderboard } = await supabase
        .from('profiles')
        .select('username, points')
        .order('points', { ascending: false })
        .limit(10)

    if (!profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <h2 className="text-xl font-semibold">Setting up your profile...</h2>
                <p className="text-muted-foreground">This usually takes a few seconds after signing up.</p>
                <Button onClick={() => window.location.reload()} variant="outline">Refresh Page</Button>
            </div>
        )
    }

    const avatarColor = getAvatarColor(profile.username)
    const initials = profile.display_name?.substring(0, 2).toUpperCase() || profile.username.substring(0, 2).toUpperCase()

    return (
        <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto py-8">

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full">

                {/* Left Column: Personal Stats */}
                <div className="md:col-span-5 flex flex-col gap-6">
                    <div className="bg-card border border-border rounded-xl p-8 shadow-sm relative overflow-hidden flex flex-col items-center">
                        {/* Minimalist Profile Card */}
                        <div className="absolute top-0 w-full h-24 bg-gradient-to-b from-primary/10 to-transparent"></div>
                        <div
                            className="w-24 h-24 rounded-full flex justify-center items-center text-3xl font-bold font-sans text-white mb-4 z-10 border-4 border-background shadow-sm"
                            style={{ backgroundColor: avatarColor }}
                        >
                            {initials}
                        </div>

                        <h2 className="text-2xl font-heading font-semibold text-foreground z-10">
                            {profile.display_name || profile.username}
                        </h2>
                        <p className="text-muted-foreground text-sm z-10 font-medium">@{profile.username}</p>

                        <div className="flex flex-col items-center mt-2 z-10">
                            <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-primary/30">
                                {getLevelProgress(profile.points || 0).levelName}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 w-full mt-6 z-10">
                            <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg border border-border/50">
                                <span className="text-sm text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Points</span>
                                <span className="text-3xl font-bold font-sans">{profile.points || 0}</span>
                            </div>
                            <div className="flex flex-col items-center p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                                <span className="text-sm text-secondary-foreground mb-1 flex items-center gap-1 uppercase tracking-wider font-semibold">
                                    <Flame className="w-4 h-4 text-orange-500" /> Streak
                                </span>
                                <span className="text-3xl font-bold font-sans text-secondary-foreground">{profile.current_streak} <span className="text-lg opacity-70">days</span></span>
                            </div>
                        </div>
                    </div>

                    {/* Mini Leaderboard */}
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <Hexagon className="w-5 h-5 text-primary" />
                            <h3 className="font-heading text-xl font-semibold">Top Scholars</h3>
                        </div>
                        <div className="flex flex-col gap-2">
                            {leaderboard?.map((u, i) => (
                                <div key={i} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <span className="text-muted-foreground font-mono text-sm inline-block w-4">{i + 1}.</span>
                                        <span className="font-medium text-sm">@{u.username}</span>
                                    </div>
                                    <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
                                        {u.points || 0} pts
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Action & Recent */}
                <div className="md:col-span-7 flex flex-col gap-6">

                    <div className="bg-gradient-to-br from-[#FAF7F2] to-[#E8DFD0] border border-border rounded-xl p-8 shadow-inner flex flex-col items-center justify-center text-center min-h-[300px] relative overflow-hidden">
                        {/* Decorative pattern */}
                        <div className="absolute opacity-5 pointer-events-none inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] mix-blend-multiply"></div>

                        <BookOpen className="w-16 h-16 text-primary mb-6 opacity-80" />
                        <h2 className="font-heading text-4xl text-foreground font-semibold mb-2">Resume Translation</h2>
                        <p className="text-muted-foreground mb-8 text-lg">
                            There are currently <span className="font-bold text-foreground">{pendingCount?.toLocaleString() || 0}</span> segments waiting to be transcribed.
                        </p>
                        <Link
                            href="/transcribe"
                            className="bg-primary text-primary-foreground px-10 py-5 rounded-md font-bold text-xl hover:bg-primary/90 transition-all shadow-md flex items-center gap-3 hover:scale-105"
                        >
                            <PenTool className="w-6 h-6" /> Start Transcribing
                        </Link>
                    </div>

                    {/* Recent Contributions */}
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex-1">
                        <h3 className="font-heading text-xl font-semibold mb-6 flex items-center gap-2">
                            Recent Contributions
                        </h3>

                        {recentTranscriptions && recentTranscriptions.length > 0 ? (
                            <div className="flex flex-col gap-4">
                                {recentTranscriptions.map((t: any) => (
                                    <div key={t.id} className="flex gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                                        <div className="w-16 h-16 bg-muted rounded-md border border-border overflow-hidden shrink-0 relative">
                                            {/* Ideally an actual Next/Image but we use standard img for dynamic URLs */}
                                            {t.segments?.image_url ? (
                                                <img src={t.segments.image_url || undefined} alt="Segment crop" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No img</div>
                                            )}
                                        </div>
                                        <div className="flex flex-col overflow-hidden w-full">
                                            <span className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold truncate">
                                                {t.segments?.manuscripts?.title || 'Unknown Manuscript'}
                                            </span>
                                            <p className="font-arabic text-lg leading-relaxed truncate text-foreground dir-rtl w-full bg-background rounded px-2 py-1 border border-border/30" dir="rtl">
                                                {t.text}
                                            </p>
                                            <span className="text-xs text-muted-foreground mt-2">
                                                {new Date(t.submitted_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                                <p>You haven&apos;t contributed yet.</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    )
}
