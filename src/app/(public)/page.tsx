"use client";

import Link from "next/link";
import { BookOpen, PenTool, Database, ArrowRight, Sparkles, Users, ScrollText, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import LineLightbox from "@/components/LineLightbox";

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
    const supabase = createClient();
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
            const [
                { count: mCount },
                { count: sCount },
                { count: pCount },
                { data: transcribedData },
                { data: pendingData },
                { data: topProfiles }
            ] = await Promise.all([
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
    }, []);

    const currentSlide = transcribed[carouselIdx];
    const slideTitle = currentSlide
        ? (Array.isArray(currentSlide.manuscripts)
            ? (currentSlide.manuscripts as any[])[0]?.title
            : (currentSlide.manuscripts as any)?.title) ?? 'Manuscrit'
        : '';

    return (
        <div className="flex flex-col min-h-screen">

            {/* ═══ HERO ═══ */}
            <section className="relative w-full py-24 md:py-36 flex flex-col lg:flex-row items-center justify-between px-6 lg:px-16 gap-16 overflow-hidden max-w-7xl mx-auto">
                {/* Ambient blobs */}
                <div className="absolute top-[15%] right-[-5%] w-[550px] h-[550px] bg-[#C4622D] rounded-full blur-[160px] opacity-[0.08] pointer-events-none" />
                <div className="absolute bottom-[5%] left-[-10%] w-[450px] h-[450px] bg-[#1B4E52] rounded-full blur-[160px] opacity-[0.08] pointer-events-none" />

                <div className="z-10 max-w-2xl space-y-8">
                    <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary bg-primary/8 border border-primary/20 px-4 py-2 rounded-full">
                        <Sparkles className="w-3.5 h-3.5" />
                        Projet de transcription collaborative
                    </div>
                    <h1 className="font-heading text-6xl md:text-7xl lg:text-8xl leading-tight text-foreground font-semibold">
                        Préservons ce<br />
                        <span className="text-primary italic">qui fut écrit.</span>
                    </h1>
                    <p className="font-sans text-xl text-muted-foreground leading-relaxed max-w-xl">
                        Khatt-GPT est un effort collaboratif visant à construire un dataset robuste pour l'entraînement de modèles <span className="text-primary font-medium">HTR (Handwritten Text Recognition)</span> spécialisés dans le style Maghribi.
                    </p>
                    <div className="flex flex-wrap items-center gap-4 pt-2">
                        <Link
                            href="/auth/register"
                            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-md font-semibold text-lg hover:bg-primary/90 transition-all hover:scale-[1.02] shadow-md"
                        >
                            Commencer à contribuer
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            href="#comment-ca-marche"
                            className="inline-flex items-center justify-center gap-2 bg-transparent text-foreground border border-border px-8 py-4 rounded-md font-semibold text-lg hover:bg-muted/50 transition-all"
                        >
                            En savoir plus
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
                                                alt="Ligne manuscrite"
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
                        <span className="text-sm uppercase tracking-widest opacity-70">Manuscrits</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <PenTool className="w-6 h-6 opacity-60 mb-1" />
                        <span className="font-sans text-5xl font-bold tracking-tighter text-[#E8DFD0]">
                            {counts.segments.toLocaleString('fr-FR')}
                        </span>
                        <span className="text-sm uppercase tracking-widest opacity-70">Segments transcrits</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <Users className="w-6 h-6 opacity-60 mb-1" />
                        <span className="font-sans text-5xl font-bold tracking-tighter text-[#E8DFD0]">
                            {counts.contributors}
                        </span>
                        <span className="text-sm uppercase tracking-widest opacity-70">Contributeurs</span>
                    </div>
                </div>
            </section>

            {leaderboard.length > 0 && (
                <section className="w-full py-16 px-6 border-t border-border bg-card/20">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex items-end justify-between mb-8">
                            <div>
                                <h2 className="font-heading text-3xl font-semibold mb-2">Classement des meilleurs contributeurs</h2>
                                <p className="text-sm text-muted-foreground">Plus vous transcrivez, plus vous montez dans le ranking.</p>
                            </div>
                            <Link href="/auth/register" className="text-sm font-semibold text-primary hover:underline">
                                Entrer dans le top
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
                                            {(user.total_contributions || 0).toLocaleString('fr-FR')} lignes
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
                                <h2 className="font-heading text-3xl font-semibold mb-2">Lignes déjà transcrites</h2>
                                <p className="text-muted-foreground text-sm">Des exemples réels issus du dataset en cours de construction.</p>
                            </div>
                            <Link href="/auth/register" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                                Voir tout <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                    <div className="flex gap-5 px-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4">
                        {transcribed.map((seg) => {
                            const t = Array.isArray(seg.manuscripts)
                                ? (seg.manuscripts as any[])[0]?.title
                                : (seg.manuscripts as any)?.title ?? 'Manuscrit';
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
                                                    alt="Ligne du manuscrit"
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
                                            ✓ Validée
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
                            <h2 className="font-heading text-3xl font-semibold mb-2">Ces lignes vous attendent</h2>
                            <p className="text-muted-foreground text-sm max-w-xl">
                                Des centaines de lignes manuscrites ne demandent qu'à être lues et transcrites. Chaque contribution compte.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {pending.map((seg) => (
                                <div key={seg.id} className="relative rounded-xl overflow-hidden border border-border bg-muted/30 aspect-[3/2] group">
                                    {seg.image_url ? (
                                        <img
                                            src={seg.image_url}
                                            alt="Ligne en attente"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-muted" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                                    <div className="absolute bottom-2 left-2 right-2">
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">En attente</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-10 text-center">
                            <Link
                                href="/auth/register"
                                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-md font-semibold hover:bg-primary/90 transition-all hover:scale-[1.02] shadow-sm"
                            >
                                Rejoindre et transcrire <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* ═══ HOW IT WORKS ═══ */}
            <section id="comment-ca-marche" className="w-full py-24 px-6 border-t border-border bg-card/30">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="font-heading text-4xl font-semibold mb-4">Comment ça fonctionne ?</h2>
                        <p className="text-muted-foreground font-sans max-w-2xl mx-auto">
                            Un processus simple en 3 étapes pour transformer des images en texte exploitable par l'IA.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="flex flex-col items-center text-center group">
                            <div className="w-20 h-20 bg-secondary/10 rounded-2xl flex items-center justify-center mb-6 text-secondary group-hover:scale-110 transition-transform">
                                <BookOpen className="w-10 h-10" />
                            </div>
                            <h3 className="font-heading text-2xl font-semibold mb-3">1. Voir un fragment</h3>
                            <p className="text-muted-foreground text-sm font-sans leading-relaxed">
                                Une ligne d'un manuscrit maghrébin vous est présentée. La ligne à transcrire est mise en surbrillance dans le contexte de la page entière.
                            </p>
                        </div>
                        <div className="flex flex-col items-center text-center group">
                            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                                <PenTool className="w-10 h-10" />
                            </div>
                            <h3 className="font-heading text-2xl font-semibold mb-3">2. Transcrire sans voyelles</h3>
                            <p className="text-muted-foreground text-sm font-sans leading-relaxed">
                                Utilisez notre éditeur pour transcrire les lettres. Inutile de mettre les diacritiques (voyelles), sauf si vous le souhaitez.
                            </p>
                        </div>
                        <div className="flex flex-col items-center text-center group">
                            <div className="w-20 h-20 bg-success/10 rounded-2xl flex items-center justify-center mb-6 text-success group-hover:scale-110 transition-transform">
                                <Database className="w-10 h-10" />
                            </div>
                            <h3 className="font-heading text-2xl font-semibold mb-3">3. Entraîner l'IA</h3>
                            <p className="text-muted-foreground text-sm font-sans leading-relaxed">
                                Vos transcriptions alimentent un dataset qui servira à entraîner un modèle HTR pour la lecture automatique des manuscrits.
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
                <h2 className="font-heading text-4xl font-semibold mb-4">Prêt à contribuer ?</h2>
                <p className="text-muted-foreground font-sans max-w-lg mx-auto mb-8 text-lg leading-relaxed">
                    Chaque ligne que vous transcrivez aide à construire le futur de la reconnaissance automatique de manuscrits arabes.
                </p>
                <Link
                    href="/auth/register"
                    className="bg-primary text-primary-foreground px-10 py-4 rounded-md font-semibold text-lg hover:bg-primary/90 transition-all hover:scale-[1.02] shadow-md inline-flex items-center gap-2"
                >
                    Créer un compte gratuit <ArrowRight className="w-5 h-5" />
                </Link>
                <p className="mt-4 text-sm text-muted-foreground">
                    Déjà inscrit ?{' '}
                    <Link href="/auth/login" className="text-primary hover:underline font-medium">
                        Se connecter
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
