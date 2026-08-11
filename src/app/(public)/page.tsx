"use client";

import Link from "next/link";
import { BookOpen, PenTool, Database, ArrowRight, Sparkles, Users, ScrollText, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import LineLightbox from "@/components/LineLightbox";
import { useLanguage } from "@/lib/language-context";

type TranscribedSegment = {
    id: string;
    image_url: string | null;
    consensus_text: string | null;
    manuscripts: { title: string } | null;
}

type PendingSegment = {
    id: string;
    image_url: string | null;
}
type LeaderboardUser = {
    username: string;
    display_name: string | null;
    points: number | null;
    total_contributions: number | null;
}

export default function LandingPage() {
    const { lang } = useLanguage();
    const c = landingCopy[lang];
    const supabase = useMemo(() => createClient(), []);
    const [counts, setCounts] = useState({ manuscripts: 0, segments: 0, contributors: 0 });
    const [transcribed, setTranscribed] = useState<TranscribedSegment[]>([]);
    const [pending, setPending] = useState<PendingSegment[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [carouselIdx, setCarouselIdx] = useState(0);
    const [selectedLine, setSelectedLine] = useState<TranscribedSegment | null>(null);
    const targetCounts = useRef({ manuscripts: 0, segments: 0, contributors: 0 });
    const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

    const nextSlide = useCallback(() => {
        setCarouselIdx(prev => (transcribed.length > 0 ? (prev + 1) % transcribed.length : 0));
    }, [transcribed.length]);

    const prevSlide = () => {
        setCarouselIdx(prev => (transcribed.length > 0 ? (prev - 1 + transcribed.length) % transcribed.length : 0));
    };

    // Auto-advance carousel
    useEffect(() => {
        if (transcribed.length > 1) {
            autoPlayRef.current = setInterval(nextSlide, 4000);
        }
        return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
    }, [transcribed.length, nextSlide]);

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            const dataPromise = Promise.all([
                supabase.from('manuscripts').select('*', { count: 'exact', head: true }),
                supabase.from('transcriptions').select('*', { count: 'exact', head: true }),
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('segments')
                    .select('id, image_url, consensus_text, manuscripts(title)')
                    .eq('status', 'validated')
                    .not('consensus_text', 'is', null)
                    .not('image_url', 'is', null)
                    .limit(8),
                supabase.from('segments')
                    .select('id, image_url')
                    .eq('status', 'pending')
                    .not('image_url', 'is', null)
                    .limit(6),
                supabase
                    .from('profiles')
                    .select('username, display_name, points, total_contributions')
                    .order('points', { ascending: false })
                    .order('total_contributions', { ascending: false })
                    .limit(10),
            ]);
            const timeout = new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error('stats_timeout')), 5000));

            let results: Awaited<typeof dataPromise>;
            try {
                results = await Promise.race([dataPromise, timeout]);
            } catch {
                return;
            }

            const [
                { count: mCount },
                { count: sCount },
                { count: pCount },
                { data: transcribedData },
                { data: pendingData },
                { data: topProfiles }
            ] = results;

            if (!isMounted) return;

            if (transcribedData) setTranscribed(transcribedData as any);
            if (pendingData) setPending(pendingData as any);
            if (topProfiles) setLeaderboard(topProfiles as LeaderboardUser[]);

            const targets = {
                manuscripts: mCount || 0,
                segments: sCount || 0,
                contributors: pCount || 0
            };
            targetCounts.current = targets;

            const duration = 2000;
            const steps = 50;
            const stepTime = duration / steps;
            let currentStep = 0;

            const timer = setInterval(() => {
                currentStep++;
                setCounts({
                    manuscripts: Math.floor((targets.manuscripts / steps) * currentStep),
                    segments: Math.floor((targets.segments / steps) * currentStep),
                    contributors: Math.floor((targets.contributors / steps) * currentStep),
                });
                if (currentStep >= steps) {
                    clearInterval(timer);
                    setCounts(targets);
                }
            }, stepTime);
        };

        fetchData();

        const channel = supabase.channel('public_stats')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transcriptions' }, () => {
                setCounts(prev => ({ ...prev, segments: prev.segments + 1 }));
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, () => {
                setCounts(prev => ({ ...prev, contributors: prev.contributors + 1 }));
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'manuscripts' }, () => {
                setCounts(prev => ({ ...prev, manuscripts: prev.manuscripts + 1 }));
            })
            .subscribe();

        return () => {
            isMounted = false;
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    const currentSlide = transcribed[carouselIdx];
    const slideTitle = currentSlide
        ? (Array.isArray(currentSlide.manuscripts)
            ? (currentSlide.manuscripts as any[])[0]?.title
            : (currentSlide.manuscripts as any)?.title) ?? c.manuscript
        : '';

    return (
        <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden" dir={lang === 'ar' ? 'rtl' : 'ltr'}>

            {/* ═══ HERO ═══ */}
            <section className="relative w-full min-w-0 py-24 md:py-36 flex flex-col lg:flex-row items-center justify-between px-6 lg:px-16 gap-16 overflow-hidden max-w-7xl mx-auto">
                {/* Ambient blobs */}
                <div className="absolute top-[15%] right-[-5%] w-[550px] h-[550px] bg-[#C4622D] rounded-full blur-[160px] opacity-[0.08] pointer-events-none" />
                <div className="absolute bottom-[5%] left-[-10%] w-[450px] h-[450px] bg-[#1B4E52] rounded-full blur-[160px] opacity-[0.08] pointer-events-none" />

                <div className="z-10 w-full min-w-0 max-w-2xl space-y-8">
                    <div className="inline-flex max-w-full flex-wrap items-center justify-center gap-2 text-center text-[10px] font-semibold uppercase tracking-widest text-primary bg-primary/8 border border-primary/20 px-3 py-2 rounded-full sm:text-xs sm:px-4">
                        <Sparkles className="w-3.5 h-3.5" />
                        {c.tag}
                    </div>
                    <h1 className="break-words font-heading text-5xl leading-tight text-foreground font-semibold sm:text-6xl md:text-7xl lg:text-8xl">
                        {c.hero1}<br />
                        <span className="text-primary italic">{c.hero2}</span>
                    </h1>
                    <p className="w-full max-w-xl font-sans text-xl text-muted-foreground leading-relaxed">
                        {c.heroDesc}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 pt-2">
                        <Link
                            href="/auth/register"
                            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-md font-semibold text-lg hover:bg-primary/90 transition-all hover:scale-[1.02] shadow-md"
                        >
                            {c.start}
                            <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                        </Link>
                        <Link
                            href="#comment-ca-marche"
                            className="inline-flex items-center justify-center gap-2 bg-transparent text-foreground border border-border px-8 py-4 rounded-md font-semibold text-lg hover:bg-muted/50 transition-all"
                        >
                            {c.more}
                        </Link>
                    </div>
                </div>

                {/* Hero visual — carousel of real transcribed lines */}
                <div className="hidden lg:block z-10 w-[480px] shrink-0">
                    <div className="relative bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
                        {/* Fake browser bar */}
                        <div className="w-full h-10 bg-muted/60 border-b border-border flex items-center px-4 gap-2 shrink-0">
                            <div className="w-3 h-3 rounded-full bg-destructive/40" />
                            <div className="w-3 h-3 rounded-full bg-amber-400/40" />
                            <div className="w-3 h-3 rounded-full bg-green-500/40" />
                            <div className="flex-1 mx-4 h-5 bg-background/60 rounded border border-border/50 flex items-center px-2">
                                <span className="text-[9px] text-muted-foreground/60 font-mono">khatt-gpt.ma/transcribe</span>
                            </div>
                        </div>
                        {transcribed.length > 0 && currentSlide ? (
                            <div
                                className="p-5 space-y-4 cursor-pointer hover:bg-muted/10 transition-colors"
                                onClick={() => setSelectedLine(currentSlide)}
                            >
                                <div className="rounded-lg overflow-hidden border border-border bg-muted/30 min-h-[120px] flex items-center justify-center relative group">
                                    {currentSlide.image_url ? (
                                        <>
                                            <img
                                                src={currentSlide.image_url}
                                                alt={c.lineAlt}
                                                className="max-h-[120px] w-full object-contain transition-transform group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                <Search className="w-8 h-8 text-white drop-shadow-md" />
                                            </div>
                                        </>
                                    ) : (
                                        <ScrollText className="w-10 h-10 text-muted-foreground opacity-20" />
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-semibold text-primary uppercase tracking-wide">{slideTitle}</p>
                                    <p className="font-arabic text-xl leading-relaxed text-right text-foreground" dir="rtl">
                                        {currentSlide.consensus_text}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-1">
                                        {transcribed.map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setCarouselIdx(i)}
                                                className={`w-1.5 h-1.5 rounded-full transition-all ${i === carouselIdx ? 'bg-primary w-4' : 'bg-border'}`}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={prevSlide} className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors">
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <button onClick={nextSlide} className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors">
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-5 space-y-4 animate-pulse">
                                <div className="h-[120px] rounded-lg bg-muted" />
                                <div className="space-y-2">
                                    <div className="h-3 w-24 bg-muted rounded" />
                                    <div className="h-6 bg-muted rounded" />
                                    <div className="h-6 w-4/5 bg-muted rounded" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ═══ IMPACT COUNTERS ═══ */}
            <section className="w-full bg-secondary text-secondary-foreground py-16 px-6">
                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                        <ScrollText className="w-6 h-6 opacity-60 mb-1" />
                        <span className="font-sans text-5xl font-bold tracking-tighter text-[#E8DFD0]">
                            {counts.manuscripts}
                        </span>
                            <span className="text-sm uppercase tracking-widest opacity-70">{c.manuscripts}</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <PenTool className="w-6 h-6 opacity-60 mb-1" />
                        <span className="font-sans text-5xl font-bold tracking-tighter text-[#E8DFD0]">
                            {counts.segments.toLocaleString(lang === 'ar' ? 'ar' : lang === 'en' ? 'en-GB' : 'fr-FR')}
                        </span>
                            <span className="text-sm uppercase tracking-widest opacity-70">{c.segments}</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <Users className="w-6 h-6 opacity-60 mb-1" />
                        <span className="font-sans text-5xl font-bold tracking-tighter text-[#E8DFD0]">
                            {counts.contributors}
                        </span>
                            <span className="text-sm uppercase tracking-widest opacity-70">{c.contributors}</span>
                    </div>
                </div>
            </section>

            {leaderboard.length > 0 && (
                <section className="w-full py-16 px-6 border-t border-border bg-card/20">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex items-end justify-between mb-8">
                            <div>
                                <h2 className="font-heading text-3xl font-semibold mb-2">{c.leaderboard}</h2>
                                <p className="text-sm text-muted-foreground">{c.rankDesc}</p>
                            </div>
                            <Link href="/auth/register" className="text-sm font-semibold text-primary hover:underline">
                                {c.enterTop}
                            </Link>
                        </div>

                        <div className="rounded-2xl border border-border bg-background/80 overflow-hidden">
                            {leaderboard.slice(0, 10).map((user, index) => (
                                <div key={`${user.username}-${index}`} className="flex items-center justify-between px-4 py-3 border-b border-border/50 last:border-b-0 hover:bg-muted/30 transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${index < 3 ? 'bg-amber-500/20 text-amber-700 border border-amber-500/30' : 'bg-muted text-muted-foreground'}`}>
                                            {index + 1}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold truncate">{user.display_name || user.username}</p>
                                            <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs px-2 py-1 rounded border border-primary/20 bg-primary/10 text-primary font-semibold">
                                            {(user.points || 0).toLocaleString('fr-FR')} XP
                                        </span>
                                        <span className="text-xs px-2 py-1 rounded border border-border bg-muted/30 text-muted-foreground font-medium hidden sm:inline">
                                             {(user.total_contributions || 0).toLocaleString(lang === 'ar' ? 'ar' : lang === 'en' ? 'en-GB' : 'fr-FR')} {c.segments.toLowerCase()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}
            {/* ═══ CAROUSEL — Transcribed lines ═══ */}
            {transcribed.length > 0 && (
                <section className="w-full py-20 bg-card/40 border-t border-border overflow-hidden">
                    <div className="max-w-7xl mx-auto px-6 mb-10">
                        <div className="flex items-end justify-between">
                            <div>
                                 <h2 className="font-heading text-3xl font-semibold mb-2">{c.transcribed}</h2>
                                 <p className="text-muted-foreground text-sm">{c.transcribedDesc}</p>
                            </div>
                            <Link href="/auth/register" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                                 {c.viewAll} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                            </Link>
                        </div>
                    </div>
                    <div className="flex gap-5 px-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4">
                        {transcribed.map((seg) => {
                            const t = Array.isArray(seg.manuscripts)
                                ? (seg.manuscripts as any[])[0]?.title
                                 : (seg.manuscripts as any)?.title ?? c.manuscript;
                            return (
                                <div
                                    key={seg.id}
                                    onClick={() => setSelectedLine(seg)}
                                    className="flex-none w-[340px] snap-center bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-primary/40 transition-all flex flex-col cursor-pointer group"
                                >
                                    <div className="relative h-[130px] bg-muted/40 flex items-center justify-center border-b border-border overflow-hidden">
                                        {seg.image_url ? (
                                            <>
                                                <img
                                                    src={seg.image_url}
                                                 alt={c.lineAlt}
                                                    className="max-h-[130px] max-w-full object-contain transition-transform group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                    <Search className="w-6 h-6 text-white drop-shadow-md" />
                                                </div>
                                            </>
                                        ) : (
                                            <BookOpen className="w-8 h-8 text-muted-foreground opacity-20" />
                                        )}
                                    </div>
                                    <div className="p-4 flex flex-col gap-2 flex-1">
                                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{t}</span>
                                        <p className="font-arabic text-lg leading-relaxed text-right text-foreground line-clamp-2" dir="rtl">
                                            {seg.consensus_text}
                                        </p>
                                        <span className="mt-auto text-[10px] text-green-600 font-semibold bg-green-500/10 px-2 py-0.5 rounded-full self-end border border-green-500/20">
                                             ✓ {c.validated}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* ═══ PENDING — Lines waiting to be transcribed ═══ */}
            {pending.length > 0 && (
                <section className="w-full py-20 border-t border-border">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="mb-10">
                             <h2 className="font-heading text-3xl font-semibold mb-2">{c.pendingTitle}</h2>
                            <p className="text-muted-foreground text-sm max-w-xl">
                                 {c.pendingDesc}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {pending.map((seg) => (
                                <div key={seg.id} className="relative rounded-xl overflow-hidden border border-border bg-muted/30 aspect-[3/2] group">
                                    {seg.image_url ? (
                                        <img
                                            src={seg.image_url}
                                             alt={c.waitingAlt}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-muted" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                                    <div className="absolute bottom-2 left-2 right-2">
                                         <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{c.pending}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-10 text-center">
                            <Link
                                href="/auth/register"
                                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-md font-semibold hover:bg-primary/90 transition-all hover:scale-[1.02] shadow-sm"
                            >
                                 {c.join} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* ═══ HOW IT WORKS ═══ */}
            <section id="comment-ca-marche" className="w-full py-24 px-6 border-t border-border bg-card/30">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                         <h2 className="font-heading text-4xl font-semibold mb-4">{c.how}</h2>
                        <p className="text-muted-foreground font-sans max-w-2xl mx-auto">
                            {c.howDesc}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="flex flex-col items-center text-center group">
                            <div className="w-20 h-20 bg-secondary/10 rounded-2xl flex items-center justify-center mb-6 text-secondary group-hover:scale-110 transition-transform">
                                <BookOpen className="w-10 h-10" />
                            </div>
                            <h3 className="font-heading text-2xl font-semibold mb-3">{c.step1}</h3>
                            <p className="text-muted-foreground text-sm font-sans leading-relaxed">
                                {c.step1Desc}
                            </p>
                        </div>
                        <div className="flex flex-col items-center text-center group">
                            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                                <PenTool className="w-10 h-10" />
                            </div>
                            <h3 className="font-heading text-2xl font-semibold mb-3">{c.step2}</h3>
                            <p className="text-muted-foreground text-sm font-sans leading-relaxed">
                                {c.step2Desc}
                            </p>
                        </div>
                        <div className="flex flex-col items-center text-center group">
                            <div className="w-20 h-20 bg-success/10 rounded-2xl flex items-center justify-center mb-6 text-success group-hover:scale-110 transition-transform">
                                <Database className="w-10 h-10" />
                            </div>
                            <h3 className="font-heading text-2xl font-semibold mb-3">{c.step3}</h3>
                            <p className="text-muted-foreground text-sm font-sans leading-relaxed">
                                {c.step3Desc}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ CTA FINAL ═══ */}
            <section className="w-full py-24 px-6 bg-primary/5 border-t border-border text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary">
                    <ScrollText className="w-8 h-8" />
                </div>
                <h2 className="font-heading text-4xl font-semibold mb-4">{c.finalTitle}</h2>
                <p className="text-muted-foreground font-sans max-w-lg mx-auto mb-8 text-lg leading-relaxed">
                    {c.finalDesc}
                </p>
                <Link
                    href="/auth/register"
                    className="bg-primary text-primary-foreground px-10 py-4 rounded-md font-semibold text-lg hover:bg-primary/90 transition-all hover:scale-[1.02] shadow-md inline-flex items-center gap-2"
                >
                    {c.create} <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                </Link>
                <p className="mt-4 text-sm text-muted-foreground">
                    {c.already}{' '}
                    <Link href="/auth/login" className="text-primary hover:underline font-medium">
                        {c.signIn}
                    </Link>
                </p>
            </section>

            <LineLightbox
                isOpen={!!selectedLine}
                onClose={() => setSelectedLine(null)}
                image_url={selectedLine?.image_url || null}
                text={selectedLine?.consensus_text || null}
                title={selectedLine ? (Array.isArray(selectedLine.manuscripts) ? selectedLine.manuscripts[0]?.title : (selectedLine.manuscripts as any)?.title) : ''}
            />
        </div>
    );
}

const landingCopy = {
    fr: {
        tag: 'Projet de transcription collaborative', hero1: 'Préservons ce', hero2: 'qui fut écrit.', heroDesc: 'Khatt-GPT est un effort collaboratif visant à construire un dataset robuste pour l’entraînement de modèles HTR (Handwritten Text Recognition) spécialisés dans le style maghrébin.', start: 'Commencer à contribuer', more: 'En savoir plus', manuscripts: 'Manuscrits', segments: 'Segments transcrits', contributors: 'Contributeurs', leaderboard: 'Classement des meilleurs contributeurs', rankDesc: 'Plus vous transcrivez, plus vous progressez dans le classement.', enterTop: 'Entrer dans le top', transcribed: 'Lignes déjà transcrites', transcribedDesc: 'Des exemples réels issus du dataset en cours de construction.', viewAll: 'Voir tout', validated: 'Validée', pendingTitle: 'Ces lignes vous attendent', pendingDesc: 'Des lignes manuscrites ne demandent qu’à être lues et transcrites. Chaque contribution compte.', pending: 'En attente', join: 'Rejoindre et transcrire', how: 'Comment ça fonctionne ?', howDesc: 'Un processus simple en 3 étapes pour transformer des images en texte exploitable par l’IA.', step1: '1. Voir un fragment', step1Desc: 'Une ligne d’un manuscrit maghrébin vous est présentée. La ligne à transcrire est mise en surbrillance dans le contexte de la page entière.', step2: '2. Transcrire sans voyelles', step2Desc: 'Utilisez notre éditeur pour transcrire les lettres. Les diacritiques sont facultatifs.', step3: '3. Entraîner l’IA', step3Desc: 'Vos transcriptions alimentent un dataset qui servira à entraîner un modèle HTR pour la lecture automatique des manuscrits.', finalTitle: 'Prêt à contribuer ?', finalDesc: 'Chaque ligne que vous transcrivez aide à construire le futur de la reconnaissance automatique de manuscrits arabes.', create: 'Créer un compte gratuit', already: 'Déjà inscrit ?', signIn: 'Se connecter', manuscript: 'Manuscrit', lineAlt: 'Ligne manuscrite', waitingAlt: 'Ligne en attente', noData: 'Aucune donnée disponible pour le moment.'
    },
    en: {
        tag: 'Collaborative transcription project', hero1: 'Preserving what', hero2: 'was written.', heroDesc: 'Khatt-GPT is a collaborative effort to build a robust dataset for training HTR (Handwritten Text Recognition) models specialised in Maghrebi script.', start: 'Start contributing', more: 'Learn more', manuscripts: 'Manuscripts', segments: 'Transcribed segments', contributors: 'Contributors', leaderboard: 'Top contributors', rankDesc: 'The more you transcribe, the further you climb.', enterTop: 'Join the leaderboard', transcribed: 'Transcribed lines', transcribedDesc: 'Real examples from the dataset under construction.', viewAll: 'View all', validated: 'Validated', pendingTitle: 'These lines are waiting for you', pendingDesc: 'Manuscript lines are ready to be read and transcribed. Every contribution matters.', pending: 'Awaiting transcription', join: 'Join and transcribe', how: 'How does it work?', howDesc: 'A simple three-step process turns images into text ready for AI research.', step1: '1. Inspect a fragment', step1Desc: 'A line from a Maghrebi manuscript is presented to you. The target line is highlighted in the context of the full page.', step2: '2. Transcribe without vowels', step2Desc: 'Use our editor to transcribe the letters. Diacritics are optional.', step3: '3. Train AI', step3Desc: 'Your transcriptions feed a dataset for training HTR models that can read Arabic manuscripts.', finalTitle: 'Ready to contribute?', finalDesc: 'Every line you transcribe helps shape the future of automatic Arabic manuscript recognition.', create: 'Create a free account', already: 'Already registered?', signIn: 'Sign in', manuscript: 'Manuscript', lineAlt: 'Manuscript line', waitingAlt: 'Line awaiting transcription', noData: 'No data available yet.'
    },
    ar: {
        tag: 'مشروع تعاوني لنسخ المخطوطات', hero1: 'نحفظ ما', hero2: 'كُتب قديماً.', heroDesc: 'خط-GPT مبادرة تعاونية لبناء مجموعة بيانات موثوقة لتدريب نماذج التعرف على الكتابة اليدوية المتخصصة في الخط المغربي.', start: 'ابدأ المساهمة', more: 'اعرف المزيد', manuscripts: 'المخطوطات', segments: 'الأسطر المنسوخة', contributors: 'المساهمون', leaderboard: 'أفضل المساهمين', rankDesc: 'كلما نسخت أكثر، تقدمت في قائمة المتصدرين.', enterTop: 'انضم إلى القائمة', transcribed: 'أسطر منسوخة', transcribedDesc: 'أمثلة حقيقية من مجموعة البيانات قيد البناء.', viewAll: 'عرض الكل', validated: 'موثق', pendingTitle: 'هذه الأسطر تنتظرك', pendingDesc: 'أسطر مخطوطة جاهزة للقراءة والنسخ. كل مساهمة لها أثر.', pending: 'في انتظار النسخ', join: 'انضم وانسخ', how: 'كيف تعمل المنصة؟', howDesc: 'ثلاث خطوات بسيطة لتحويل الصور إلى نص قابل للاستخدام في أبحاث الذكاء الاصطناعي.', step1: '١. معاينة جزء', step1Desc: 'يظهر لك سطر من مخطوطة مغربية، مع تمييز السطر المطلوب داخل الصفحة كاملة.', step2: '٢. النسخ دون حركات', step2Desc: 'استخدم محررنا لنسخ الحروف. التشكيل اختياري.', step3: '٣. تدريب الذكاء الاصطناعي', step3Desc: 'تغذي نسخك مجموعة بيانات لتدريب نماذج تقرأ المخطوطات العربية.', finalTitle: 'هل أنت مستعد للمساهمة؟', finalDesc: 'كل سطر تنسخه يساعد في بناء مستقبل التعرف الآلي على المخطوطات العربية.', create: 'إنشاء حساب مجاني', already: 'لديك حساب بالفعل؟', signIn: 'تسجيل الدخول', manuscript: 'مخطوطة', lineAlt: 'سطر من المخطوطة', waitingAlt: 'سطر في انتظار النسخ', noData: 'لا تتوفر بيانات بعد.'
    },
} as const
