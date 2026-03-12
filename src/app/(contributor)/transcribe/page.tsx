"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getNextSegment,
  submitTranscription,
  flagSegment,
  updateTranscription,
  getPendingSegmentCount,
  getGamificationSnapshot,
  getSegmentById,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import {
  Flag,
  SkipForward,
  Send,
  AlertCircle,
  Sparkles,
  Keyboard,
  BookOpen,
  Search,
  X,
  ChevronRight,
  Loader2,
  History,
  ImageIcon,
  CheckCircle2,
  PenLine,
  Highlighter,
  FileImage,
  Trophy,
  Zap,
  Flame,
  Star,
  Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { OnboardingModal } from "@/components/OnboardingModal";
import DraggableKeyboard from "@/components/DraggableKeyboard";
import { useRef } from "react";
import { get, set } from "idb-keyval";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/language-context";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ManuscriptNavigation } from "./ManuscriptNavigation";

type SegmentData = {
  id: string;
  manuscript_id: string;
  page_id: string;
  image_url: string;
  order_index: number;
  polygon?: any;
  manuscript_title: string;
  manuscript_description?: string;
  manuscript_reference_text_url?: string;
  manuscript_pdf_url?: string;
  page_image_url: string;
  page_label?: string;
  other_transcriptions?: {
    text: string;
    profiles: {
      email: string;
      avatar_url: string | null;
      role: string;
    };
  }[];
};

type GamificationSnapshot = {
  level: {
    level: number;
    levelName: string;
    nextLevelXp: number | null;
    xpIntoLevel: number;
    xpForNextLevel: number;
    progressPct: number;
  };
  points: number;
  streak: number;
  totalContributions: number;
  boosts: Array<{ slug: string; label: string; isDoubleXp?: boolean }>;
  badges: Array<{
    slug: string;
    name: string;
    description: string;
    unlocked: boolean;
    progressPct: number;
    currentValue: number;
    target: number;
    xpReward: number;
  }>;
  nextBadge: {
    slug: string;
    name: string;
    description: string;
    progressPct: number;
    currentValue: number;
    target: number;
    xpReward: number;
  } | null;
};

export default function TranscribePage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <TranscribeContent />
    </Suspense>
  );
}

function TranscribeContent() {
  const searchParams = useSearchParams();
  const manuscriptId = searchParams.get('manuscriptId') || undefined;
  const [segment, setSegment] = useState<SegmentData | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [errorObj, setErrorObj] = useState<string | null>(null);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [referenceText, setReferenceText] = useState("");
  const [loadingRef, setLoadingRef] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<
    "reference" | "pdf" | "community"
  >("community");
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [isDraggingZoom, setIsDraggingZoom] = useState(false);
  const [gamification, setGamification] = useState<GamificationSnapshot | null>(
    null,
  );
  const [rewardBurst, setRewardBurst] = useState<{
    xp: number;
    combo: number;
    streak: number;
    id: number;
  } | null>(null);
  const [badgeReveal, setBadgeReveal] = useState<
    Array<{ name: string; description: string; points: number }>
  >([]);
  const [showBadgeReveal, setShowBadgeReveal] = useState(false);
  const [showGamification, setShowGamification] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const rewardTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isNavOpen, setIsNavOpen] = useState(false);

  const { t } = useLanguage();
  const { toast } = useToast();

  const loadSegment = useCallback(async (targetId?: string) => {
    setLoading(true);
    setErrorObj(null);
    setText("");
    try {
      const nextSeg = await getNextSegment(manuscriptId, targetId);
      setSegment(nextSeg as any);
      if (nextSeg?.id) {
        const saved = localStorage.getItem(`waraka_autosave_${nextSeg.id}`);
        if (saved) setText(saved);
      }
    } catch (err: any) {
      setErrorObj(err.message);
    } finally {
      setLoading(false);
    }
  }, [manuscriptId]);

  useEffect(() => {
    loadSegment();
    fetchPendingCount();
    fetchGamification();
  }, [loadSegment]);

  const fetchPendingCount = async () => {
    const count = await getPendingSegmentCount();
    setPendingCount(count);
  };

  const fetchGamification = async () => {
    const snapshot = await getGamificationSnapshot();
    if (snapshot) {
      setGamification(snapshot as GamificationSnapshot);
    }
  };

  // Fetch reference text when segment changes
  useEffect(() => {
    if (segment?.manuscript_reference_text_url) {
      const fetchRef = async () => {
        setLoadingRef(true);
        try {
          const res = await fetch(segment.manuscript_reference_text_url!);
          const content = await res.text();
          setReferenceText(content);
        } catch (e) {
          console.error("Failed to fetch reference text", e);
        } finally {
          setLoadingRef(false);
        }
      };
      fetchRef();
    } else {
      setReferenceText("");
    }
  }, [segment]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "Enter") {
        if (text.trim() && !submitting && segment) {
          handleSubmit();
        }
      }
      if (e.ctrlKey && e.key === "ArrowRight") {
        if (!submitting) {
          handleSkip();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [text, submitting, segment]);

  // Online/Offline sync listener
  useEffect(() => {
    setIsOffline(!navigator.onLine);

    const handleOnline = async () => {
      setIsOffline(false);
      const queue: { id: string; text: string }[] =
        (await get("waraka_offline_queue")) || [];
      if (queue.length > 0) {
        toast({ title: "Back online! Syncing transcriptions..." });
        for (const item of queue) {
          await submitTranscription(item.id, item.text).catch(console.error);
        }
        await set("waraka_offline_queue", []);
        toast({
          title: "Offline transcriptions synced! 🎉",
          description: `Successfully synced ${queue.length} transcripts.`,
        });
      }
    };

    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [toast]);

  // Auto-save transcription text
  useEffect(() => {
    if (segment?.id && !loading && !submitting) {
      const delayDebounceFn = setTimeout(() => {
        if (text) {
          localStorage.setItem(`waraka_autosave_${segment.id}`, text);
        } else {
          localStorage.removeItem(`waraka_autosave_${segment.id}`);
        }
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [text, segment?.id, loading, submitting]);

  // Segment Zoom & Pan Logic
  const handleSegmentWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) return; // Allow browser zoom
    e.preventDefault();
    const delta = -e.deltaY;
    const scaleStep = 0.1;
    const newScale = Math.min(
      Math.max(zoomScale + (delta > 0 ? scaleStep : -scaleStep), 0.5),
      5,
    );
    setZoomScale(newScale);
  };

  const handleSegmentMouseDown = (e: React.MouseEvent) => {
    if (zoomScale > 1) {
      setIsDraggingZoom(true);
    }
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDraggingZoom) {
        setZoomPos((prev) => ({
          x: prev.x + e.movementX,
          y: prev.y + e.movementY,
        }));
      }
    };
    const handleGlobalMouseUp = () => setIsDraggingZoom(false);

    if (isDraggingZoom) {
      window.addEventListener("mousemove", handleGlobalMouseMove);
      window.addEventListener("mouseup", handleGlobalMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDraggingZoom]);

  const resetZoom = () => {
    setZoomScale(1);
    setZoomPos({ x: 0, y: 0 });
  };

  const centerOnSegment = useCallback(() => {
    if (
      !imageContainerRef.current ||
      !segment?.polygon ||
      !Array.isArray(segment.polygon) ||
      segment.polygon.length === 0 ||
      imgSize.width === 0
    )
      return;

    const isMobile = window.innerWidth < 1024;
    if (isMobile) {
      resetZoom();
      return;
    }

    const container = imageContainerRef.current;
    const containerW = container.clientWidth;
    const containerH = container.clientHeight;

    const renderScale = Math.min(
      containerW / imgSize.width,
      containerH / imgSize.height,
    );

    const xs = (segment.polygon as any[]).map((p) => Number(p.x));
    const ys = (segment.polygon as any[]).map((p) => Number(p.y));
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);

    const polyCenterX = (minX + maxX) / 2;
    const polyCenterY = (minY + maxY) / 2;

    // Size of the polygon in container pixels
    const polyHeight = (maxY - minY) * renderScale;
    const polyWidth = (maxX - minX) * renderScale;

    // Ensure the entire line is visible horizontally with a small margin (40px)
    const targetZoomX = (containerW - 40) / polyWidth;

    // Ensure the line is visible vertically with a margin (100px)
    const targetZoomY = (containerH - 100) / polyHeight;

    // Use the smaller zoom to fit the segment entirely on screen
    let targetZoom = Math.min(targetZoomX, targetZoomY);

    // Clamp the zoom to sensible bounds. We don't want to over-zoom short words (max 2.8)
    // or zoom out past the full image view (min 1.0).
    const maxZoom = window.innerWidth < 768 ? 2.8 : 2.5;
    targetZoom = Math.min(Math.max(targetZoom, 1.0), maxZoom);

    // Pan so polygon center = container center
    const panX = (imgSize.width / 2 - polyCenterX) * renderScale;
    const panY = (imgSize.height / 2 - polyCenterY) * renderScale;

    setZoomScale(targetZoom);

    // On mobile, offset slightly up so keyboard doesn't cover if they type
    const yOffset = 0; // We return early on mobile now, so yOffset is 0.
    setZoomPos({ x: panX, y: panY + yOffset });
  }, [segment, imgSize.width, imgSize.height]);

  const handlePageImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const natW = img.naturalWidth;
    const natH = img.naturalHeight;
    setImgSize({ width: natW, height: natH });
  };

  // Auto-center on desktop, zoom out to fit page on mobile
  useEffect(() => {
    if (imgSize.width > 0 && segment?.id) {
      const isMobile = window.innerWidth < 1024;
      if (isMobile) {
        resetZoom();
      } else {
        setTimeout(() => centerOnSegment(), 100);
      }
    }
  }, [segment?.id, imgSize.width, centerOnSegment]);

  const handleSubmit = async () => {
    if (!segment || !text.trim()) return;
    setSubmitting(true);

    if (!navigator.onLine) {
      const queue: any[] = (await get("waraka_offline_queue")) || [];
      queue.push({ id: segment.id, text });
      await set("waraka_offline_queue", queue);
      toast({
        title: "Offline Mode \uD83D\uDCC4",
        description: "Saved to device. Will sync when connection is restored.",
      });
      setText("");
      setSessionCount((prev) => prev + 1);
      setSubmitting(false);
      return;
    }

    const result: any = isEditing
      ? await updateTranscription(isEditing, text)
      : await submitTranscription(segment.id, text);

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    localStorage.removeItem(`waraka_autosave_${segment.id}`);

    if (isEditing) {
      toast({ title: "Updated", description: "Transcription updated." });
    } else {
      const gain = result.reward?.finalXp || 0;
      const combo = Number(result.reward?.multiplier || 1);
      const streakNow = Number(result.reward?.newStreak || 0);
      const boostLabel = result.reward?.boosts?.length
        ? "Boosts: " + result.reward.boosts.map((b: any) => b.label).join(", ")
        : "Keep your streak active to unlock XP multipliers.";

      toast({
        title: "+" + gain + " XP",
        description: boostLabel,
      });
      setSessionCount((prev) => prev + 1);

      setRewardBurst({
        xp: gain,
        combo,
        streak: streakNow,
        id: Date.now(),
      });

      if (rewardTimeoutRef.current) {
        clearTimeout(rewardTimeoutRef.current);
      }
      rewardTimeoutRef.current = setTimeout(() => {
        setRewardBurst(null);
      }, 2200);

      if (
        Array.isArray(result.achievements) &&
        result.achievements.length > 0
      ) {
        const normalized = result.achievements.map((item: any) => ({
          name: item.name_fr || item.title || item.slug || "Badge unlocked",
          description:
            item.description_fr ||
            item.description ||
            "Nouveau badge debloque.",
          points: Number(item.points || 0),
        }));
        setBadgeReveal(normalized);
        setShowBadgeReveal(true);
      }
    }

    if (result.gamification) {
      setGamification(result.gamification as GamificationSnapshot);
    } else if (!isEditing) {
      fetchGamification();
    }

    setIsEditing(null);
    await loadSegment();
    fetchPendingCount();
    setSubmitting(false);
  };

  const startEditing = async (t: any) => {
    setLoading(true);
    try {
      const seg = await getSegmentById(t.segment_id);
      setSegment(seg as any);
      setIsEditing(t.id);
      const saved = localStorage.getItem(`waraka_autosave_${t.segment_id}`);
      setText(saved || t.text);
      textareaRef.current?.focus();
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger le segment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelEditing = () => {
    setIsEditing(null);
    setText("");
  };

  const handleSkip = async () => {
    setSubmitting(true);
    await loadSegment();
    fetchPendingCount();
    setSubmitting(false);
  };

  const handleFlag = async () => {
    if (!segment) return;
    setSubmitting(true);
    await flagSegment(segment.id);
    localStorage.removeItem(`waraka_autosave_${segment.id}`);
    toast({
      title: "Segment flagged",
      description: "Admin will review this segment.",
    });
    await loadSegment();
    fetchPendingCount();
    setSubmitting(false);
  };

  const handleKeyPress = (char: string) => {
    if (!textareaRef.current) {
      setText((prev) => prev + char);
      return;
    }
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const newValue = text.substring(0, start) + char + text.substring(end);
    setText(newValue);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd =
          start + char.length;
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleBackspace = () => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;

    if (start === end && start > 0) {
      const newValue = text.substring(0, start - 1) + text.substring(end);
      setText(newValue);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart =
            textareaRef.current.selectionEnd = start - 1;
          textareaRef.current.focus();
        }
      }, 0);
    } else if (start !== end) {
      const newValue = text.substring(0, start) + text.substring(end);
      setText(newValue);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart =
            textareaRef.current.selectionEnd = start;
          textareaRef.current.focus();
        }
      }, 0);
    }
  };

  if (loading && !segment) {
    return (
      <div className="flex h-[calc(100vh-140px)] w-full items-center justify-center">
        <div className="animate-spin text-primary">
          <Sparkles className="w-8 h-8" />
        </div>
      </div>
    );
  }

  if (!segment && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)] w-full text-center space-y-4 animate-in fade-in">
        <div className="w-24 h-24 bg-success/10 text-success rounded-full flex items-center justify-center">
          <Sparkles className="w-12 h-12" />
        </div>
        <h2 className="text-4xl font-heading font-semibold text-foreground">
          {t("transcribe.all_caught_up")}
        </h2>
        <p className="text-muted-foreground font-sans max-w-md">
          {t("transcribe.no_segments")}
        </p>
      </div>
    );
  }

  const title = segment?.manuscript_title || "Unknown Manuscript";
  const hasNonArabic =
    text.trim() !== "" &&
    /[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\s.,،؟!؛'"]/g.test(text);

  const getHighlightedText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const regex = new RegExp(`(${highlight})`, "gi");
    const parts = text.split(regex);
    return (
      <span id="reference-content">
        {parts.map((part, i) => {
          const isMatch = part.toLowerCase() === highlight.toLowerCase();
          return isMatch ? (
            <mark
              key={i}
              id={`match-${i}`}
              className="bg-primary/30 text-foreground ring-1 ring-primary/20 rounded-sm px-0.5 scroll-mt-20 inline-block"
            >
              {part}
            </mark>
          ) : (
            part
          );
        })}
      </span>
    );
  };

  const getSearchResults = () => {
    if (!searchTerm.trim() || !referenceText) return [];
    const regex = new RegExp(`(${searchTerm})`, "gi");
    const matches = [];
    let match;
    let matchCounter = 0;

    while ((match = regex.exec(referenceText)) !== null) {
      const start = Math.max(0, match.index - 60);
      const end = Math.min(
        referenceText.length,
        match.index + match[0].length + 60,
      );
      matches.push({
        index: match.index,
        id: matchCounter,
        snippet: referenceText.substring(start, end),
        match: match[0],
      });
      matchCounter++;
      if (matches.length > 100) break;
    }
    return matches;
  };

  const scrollToMatch = (id: number) => {
    const marks = document.querySelectorAll("#reference-content mark");
    if (marks[id]) {
      marks[id].scrollIntoView({ behavior: "smooth", block: "center" });
      marks[id].classList.add(
        "ring-4",
        "ring-primary",
        "transition-all",
        "duration-500",
      );
      setTimeout(() => {
        marks[id].classList.remove("ring-4", "ring-primary");
      }, 2000);
    }
  };

  const topBadges = gamification?.badges?.slice(0, 6) || [];

  return (
    <div className="flex flex-col w-full h-[calc(100vh-64px)] animate-in fade-in duration-500 overflow-hidden bg-background">
      <OnboardingModal />

      <AnimatePresence>
        {rewardBurst && (
          <motion.div
            key={rewardBurst.id}
            initial={{ opacity: 0, y: 24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.9 }}
            transition={{ duration: 0.35 }}
            className="fixed right-4 top-20 z-[85]"
          >
            <div className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/20 via-primary/20 to-secondary/20 px-4 py-3 shadow-2xl backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    +{rewardBurst.xp} XP
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Combo x{rewardBurst.combo.toFixed(2)} | Streak{" "}
                    {rewardBurst.streak}j
                  </p>
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 flex gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.span
                    key={i}
                    initial={{ y: 0, opacity: 0.7, scale: 1 }}
                    animate={{ y: -18 - i * 2, opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.9, delay: i * 0.06 }}
                    className="h-2 w-2 rounded-full bg-amber-500"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBadgeReveal && badgeReveal.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[95] bg-black/45 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              className="w-full max-w-lg rounded-2xl border border-amber-500/30 bg-background/95 shadow-2xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-600" />
                  <h3 className="font-heading text-xl font-semibold">
                    Badge Unlock
                  </h3>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowBadgeReveal(false)}
                >
                  Fermer
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Nouveau palier atteint. Continue pour maintenir le momentum.
              </p>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {badgeReveal.map((badge, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-foreground">
                        {badge.name}
                      </p>
                      <span className="text-[11px] font-semibold text-emerald-700">
                        +{badge.points} XP
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {badge.description}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sub-header */}
      <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 py-2 border-b border-border/50 shrink-0 bg-background/50 backdrop-blur-sm z-30 gap-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-700 text-[10px] font-bold px-3 py-1 rounded-full border border-amber-500/20">
            <Highlighter className="w-3.5 h-3.5" />
            {t("transcribe.instruction")}
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-lg border border-border/50 relative group cursor-default">
            <span className="text-primary/70 shrink-0">
              #{segment?.order_index || "..."}
            </span>
            <span className="w-[1px] h-3 bg-border shrink-0" />
            <span className="max-w-[120px] sm:max-w-[200px] md:max-w-[300px] truncate">
              {title}
            </span>
            {segment?.page_label && (
              <>
                <span className="w-[1px] h-3 bg-border shrink-0" />
                <span className="text-primary font-bold shrink-0">
                  {segment.page_label}
                </span>
              </>
            )}
            {/* Tooltip personnalisé pour afficher le titre complet au survol */}
            <div className="absolute top-full left-0 mt-2 hidden group-hover:block z-[100] bg-popover text-popover-foreground text-xs p-2.5 rounded-md shadow-xl border border-border/50 whitespace-normal w-max max-w-[280px] pointer-events-none animate-in fade-in zoom-in-95 duration-200">
              {title}
            </div>
          </div>

          {segment?.manuscript_id && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNavOpen(true)}
              className="gap-2 rounded-full h-8 px-3 border-primary/40 text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
            >
              <List className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-tight">Naviguer</span>
            </Button>
          )}
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${isOffline ? "bg-amber-500" : "bg-primary animate-pulse"}`}
            ></span>
            {t("transcribe.session")} : {sessionCount}{" "}
            {t("transcribe.segments")}
          </p>
          {isOffline && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
              {t("transcribe.offline")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {gamification && (
            <div className="hidden lg:flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-700 px-2.5 py-1 rounded-full border border-amber-500/20 shadow-sm">
                <Zap className="w-3 h-3" />
                <span className="text-xs font-bold leading-none">
                  {gamification.points} XP
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowGamification(!showGamification)}
                className={`w-6 h-6 p-0 rounded-full transition-all border ${showGamification ? "bg-primary text-primary-foreground border-primary shadow-md scale-110" : "bg-background text-muted-foreground border-border hover:bg-muted"}`}
                title="Toggle XP boosts and levels"
              >
                <ChevronRight
                  className={`w-3 h-3 transition-transform duration-300 ${showGamification ? "rotate-90" : ""}`}
                />
              </Button>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={centerOnSegment}
            className="gap-2 rounded-full h-8 px-3 border-primary/30 text-primary hover:bg-primary/5"
            title={t("transcribe.center_line")}
          >
            <Highlighter className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">
              {t("transcribe.center_line")}
            </span>
          </Button>
          {segment?.manuscript_pdf_url && (
            <Button
              variant={activeTab === "pdf" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setActiveTab("pdf");
              }}
              className="gap-2 rounded-full h-8 px-3 border-red-500/30 text-red-600 hover:bg-red-50 hidden sm:flex"
            >
              <BookOpen className="w-3.5 h-3.5" />
              PDF
            </Button>
          )}
          <div className="hidden md:flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/30 px-2 py-1 rounded-md border border-border/50">
            <kbd className="font-mono bg-background border border-border px-1 rounded">
              Ctrl
            </kbd>{" "}
            +{" "}
            <kbd className="font-mono bg-background border border-border px-1 rounded">
              Enter
            </kbd>{" "}
            {t("transcribe.submit_hint") || "pour valider"}
          </div>
        </div>
      </div>

      {gamification && (
        <div className="w-full border-b border-border/50 bg-background/50 backdrop-blur-sm px-4 py-2 flex items-center justify-between lg:hidden z-20">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-full border border-primary/20">
              <Zap className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">
                {gamification.points} XP
              </span>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Niveau {gamification.level.level}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowGamification(!showGamification)}
            className={`w-8 h-8 p-0 rounded-full transition-all ${showGamification ? "bg-primary text-primary-foreground rotate-180" : "bg-muted text-muted-foreground"}`}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      <AnimatePresence>
        {gamification && showGamification && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full border-b border-border/50 bg-gradient-to-r from-primary/5 via-amber-500/5 to-secondary/5 px-4 py-3 shrink-0 overflow-hidden"
          >
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
              <div className="rounded-xl border border-primary/20 bg-background/80 p-3">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  <span className="flex items-center gap-2">
                    <Trophy className="w-3.5 h-3.5 text-primary" /> Niveau{" "}
                    {gamification.level.level}
                  </span>
                  <span className="text-primary">
                    {gamification.level.levelName}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden mb-2">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${gamification.level.progressPct}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground flex items-center justify-between">
                  <span>{gamification.points} XP</span>
                  <span>
                    {gamification.level.nextLevelXp
                      ? `${gamification.level.xpIntoLevel}/${gamification.level.xpForNextLevel} vers le prochain palier`
                      : "Niveau max atteint"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-amber-500/20 bg-background/80 p-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  <Zap className="w-3.5 h-3.5 text-amber-600" /> Boosts actifs
                </div>
                <div className="flex flex-wrap gap-2">
                  {gamification.boosts.length > 0 ? (
                    gamification.boosts.map((boost) => (
                      <span
                        key={boost.slug}
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${boost.isDoubleXp ? "border-amber-500/40 bg-amber-500/10 text-amber-700" : "border-primary/30 bg-primary/10 text-primary"}`}
                      >
                        <Flame className="w-3 h-3" /> {boost.label}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Aucun boost actif. Serie de 3 jours = premier
                      multiplicateur.
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-secondary/20 bg-background/80 p-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  <Star className="w-3.5 h-3.5 text-secondary" /> Prochain badge
                </div>
                {gamification.nextBadge ? (
                  <>
                    <div className="text-sm font-semibold text-foreground mb-1">
                      {gamification.nextBadge.name}
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {gamification.nextBadge.description}
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden mb-2">
                      <div
                        className="h-full bg-secondary transition-all"
                        style={{
                          width: `${gamification.nextBadge.progressPct}%`,
                        }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground flex justify-between">
                      <span>
                        {gamification.nextBadge.currentValue}/
                        {gamification.nextBadge.target}
                      </span>
                      <span>+{gamification.nextBadge.xpReward} XP</span>
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    Tous les badges disponibles sont debloques.
                  </div>
                )}
              </div>
            </div>

            {topBadges.length > 0 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {topBadges.map((badge) => (
                  <div
                    key={badge.slug}
                    className={`min-w-[180px] rounded-lg border px-3 py-2 ${badge.unlocked ? "border-emerald-500/30 bg-emerald-500/10" : "border-border bg-background/70"}`}
                  >
                    <div className="text-xs font-bold truncate flex items-center justify-between gap-2">
                      <span>{badge.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        +{badge.xpReward} XP
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {badge.currentValue}/{badge.target}
                    </div>
                    <div className="mt-1 w-full h-1.5 rounded bg-muted overflow-hidden">
                      <div
                        className={`h-full ${badge.unlocked ? "bg-emerald-500" : "bg-primary"}`}
                        style={{ width: `${badge.progressPct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex flex-1 gap-0 pt-0 min-h-0 relative">
        {/* Main Content: Image Left, Transcription Right */}
        <div className="flex-1 flex flex-col lg:flex-row min-w-0 bg-background overflow-hidden relative">
          {/* Image Area — full page by default */}
          <div
            ref={imageContainerRef}
            className="flex-[2] lg:flex-auto lg:w-1/2 flex flex-col relative justify-center items-center bg-[#F3EFE9] border-b lg:border-b-0 lg:border-r border-border/50 overflow-hidden cursor-crosshair shadow-inner"
            onWheel={handleSegmentWheel}
            onMouseDown={handleSegmentMouseDown}
          >
            <div
              className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-out select-none"
              style={{
                transform: `scale(${zoomScale}) translate(${zoomPos.x / zoomScale}px, ${zoomPos.y / zoomScale}px)`,
                transformOrigin: "center",
              }}
            >
              {segment?.page_image_url ? (
                <div className="relative">
                  <img
                    src={segment.page_image_url || undefined}
                    alt="Page du manuscrit"
                    className="max-h-full max-w-full object-contain drop-shadow-2xl rounded-sm"
                    draggable={false}
                    onLoad={handlePageImageLoad}
                  />
                  {segment?.polygon &&
                    Array.isArray(segment.polygon) &&
                    imgSize.width > 0 && (
                      <svg
                        viewBox={`0 0 ${imgSize.width} ${imgSize.height}`}
                        className="absolute inset-0 w-full h-full pointer-events-none z-10"
                        preserveAspectRatio="xMidYMid meet"
                      >
                        <defs>
                          <mask id="seg-mask">
                            <rect
                              width={imgSize.width}
                              height={imgSize.height}
                              fill="white"
                            />
                            <polygon
                              points={segment.polygon
                                .map((p: any) => `${p.x},${p.y}`)
                                .join(" ")}
                              fill="black"
                            />
                          </mask>
                        </defs>
                        {/* Darken everything outside the polygon */}
                        <rect
                          width={imgSize.width}
                          height={imgSize.height}
                          fill="rgba(0,0,0,0.5)"
                          mask="url(#seg-mask)"
                        />
                        {/* Highlight the polygon */}
                        <polygon
                          points={segment.polygon
                            .map((p: any) => `${p.x},${p.y}`)
                            .join(" ")}
                          fill="rgba(255,200,0,0.12)"
                          stroke="rgba(255,180,0,0.9)"
                          strokeWidth={Math.max(2, imgSize.width / 300)}
                        />
                      </svg>
                    )}
                </div>
              ) : segment?.image_url ? (
                <img
                  src={segment.image_url || undefined}
                  alt="Segment"
                  className="max-h-full max-w-full object-contain drop-shadow-2xl rounded-sm"
                  draggable={false}
                />
              ) : null}
            </div>

            <div className="absolute top-3 left-3 z-30 select-none flex gap-2">
              {zoomScale !== 1 && (
                <div className="bg-background/90 backdrop-blur shadow-sm border border-border px-3 py-1 rounded-full text-[10px] font-bold tracking-tight">
                  <button
                    onClick={resetZoom}
                    className="text-primary hover:underline"
                  >
                    {Math.round(zoomScale * 100)}% ({t("transcribe.reset_zoom")}
                    )
                  </button>
                </div>
              )}
              {zoomScale === 1 &&
                segment?.polygon &&
                Array.isArray(segment.polygon) && (
                  <div className="bg-primary/90 text-primary-foreground backdrop-blur shadow-sm border border-primary/50 px-3 py-1 rounded-full text-[10px] font-bold tracking-tight pointer-events-auto transition-opacity hover:bg-primary">
                    <button
                      onClick={centerOnSegment}
                      className="flex items-center gap-1"
                    >
                      <Search className="w-3 h-3" /> Zoomer sur la ligne
                    </button>
                  </div>
                )}
            </div>

            {/* Zoom Hint */}
            <div className="absolute bottom-3 right-3 text-[9px] text-muted-foreground opacity-40 select-none flex items-center gap-2 pointer-events-none">
              <Search className="w-3 h-3" />
              {t("transcribe.zoom_hint")}
            </div>
          </div>

          {/* Transcription Area */}
          <div className="flex-[3] lg:flex-auto lg:w-1/2 flex flex-col p-4 lg:px-8 lg:pb-8 lg:pt-6 gap-4 overflow-hidden relative z-10 bg-background">
            <div className="flex justify-between items-center shrink-0">
              <h2
                className="text-xl font-heading font-semibold text-primary"
                dir="rtl"
              >
                {t("transcribe.transcription_header")}
              </h2>
              <div className="flex gap-2">
                <Button
                  variant={showKeyboard ? "default" : "outline"}
                  size="sm"
                  className="gap-2 h-8 rounded-full text-xs"
                  onClick={() => setShowKeyboard(!showKeyboard)}
                >
                  <Keyboard className="w-3.5 h-3.5" />
                  {showKeyboard
                    ? t("transcribe.hide")
                    : t("transcribe.keyboard")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFlag}
                  disabled={submitting}
                  className="w-8 h-8 p-0 shrink-0 border-destructive/20 hover:bg-destructive/10 rounded-full"
                  title={t("transcribe.flag")}
                >
                  <Flag className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            </div>

            {errorObj && (
              <div className="bg-destructive/10 text-destructive text-[10px] p-2 rounded flex items-center gap-2 shrink-0">
                <AlertCircle className="w-3 h-3" /> {errorObj}
              </div>
            )}

            {hasNonArabic && (
              <div className="bg-orange-500/10 text-orange-600 text-[10px] p-2 rounded flex items-center gap-2 border border-orange-500/20 shrink-0">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                <span>{t("transcribe.non_arabic")}</span>
              </div>
            )}

            <div className="flex-1 w-full relative min-h-0 flex flex-col gap-2">
              <Textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t("transcribe.placeholder")}
                dir="rtl"
                lang="ar"
                disabled={submitting}
                className="resize-none h-32 min-h-[120px] shrink-0 font-arabic text-2xl leading-[2] bg-[#FAF7F2] border-border shadow-inner focus-visible:ring-primary p-4 rounded-xl text-foreground !outline-none focus:border-primary/50"
              />

              <AnimatePresence>
                {showKeyboard && (
                  <DraggableKeyboard
                    onKeyPress={handleKeyPress}
                    onBackspace={handleBackspace}
                    onClose={() => setShowKeyboard(false)}
                  />
                )}
              </AnimatePresence>

              {/* Submit area */}
              <div className="flex gap-2 shrink-0">
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !text.trim()}
                  className={`flex-1 h-12 text-sm font-bold tracking-wide shadow-md ${isEditing ? "bg-amber-600 hover:bg-amber-700" : ""}`}
                >
                  {submitting ? (
                    t("transcribe.submitting")
                  ) : isEditing ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />{" "}
                      {t("transcribe.save_edit")}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" /> {t("transcribe.submit")}
                    </>
                  )}
                </Button>
                {isEditing && (
                  <Button
                    variant="outline"
                    onClick={cancelEditing}
                    disabled={submitting}
                    className="h-12 px-4 font-medium border-amber-500/30 text-amber-700 hover:bg-amber-50"
                  >
                    {t("transcribe.cancel")}
                  </Button>
                )}
                {!isEditing && (
                  <Button
                    variant="outline"
                    onClick={handleSkip}
                    disabled={submitting}
                    className="h-12 px-4 font-medium"
                    title={t("transcribe.skip_title")}
                  >
                    <SkipForward className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Tabs Area Below Textarea */}
              <div className="flex-1 min-h-[300px] mt-4 border border-border rounded-xl bg-card overflow-hidden flex flex-col shadow-sm">
                {/* Tabs Header */}
                <div className="flex border-b border-border shrink-0">
                  <button
                    onClick={() => setActiveTab("reference")}
                    className={`flex-1 py-3 text-xs font-bold flex flex-col items-center gap-1 transition-colors ${activeTab === "reference" ? "text-primary bg-primary/5 border-b-2 border-primary" : "text-muted-foreground hover:bg-muted"}`}
                  >
                    <BookOpen className="w-4 h-4" /> Référence
                  </button>
                  <button
                    onClick={() => setActiveTab("community")}
                    className={`flex-1 py-3 text-xs font-bold flex flex-col items-center gap-1 transition-colors ${activeTab === "community" ? "text-primary bg-primary/5 border-b-2 border-primary" : "text-muted-foreground hover:bg-muted"}`}
                  >
                    <div className="relative">
                      <Users className="w-4 h-4" />
                      {segment?.other_transcriptions && segment.other_transcriptions.length > 0 && (
                        <span className="absolute -top-1.5 -right-2.5 bg-primary text-primary-foreground text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                          {segment.other_transcriptions.length}
                        </span>
                      )}
                    </div>
                    Propositions
                  </button>
                  {segment?.manuscript_pdf_url && (
                    <button
                      onClick={() => setActiveTab("pdf")}
                      className={`flex-1 py-3 text-xs font-bold flex flex-col items-center gap-1 transition-colors ${activeTab === "pdf" ? "text-red-600 bg-red-50 border-b-2 border-red-600" : "text-muted-foreground hover:bg-muted"}`}
                    >
                      <FileImage className="w-4 h-4" /> PDF
                    </button>
                  )}

                </div>

                <div className="flex-1 overflow-hidden flex flex-col">
                  {activeTab === "reference" && (
                    <>
                      <div className="p-4 border-b border-border flex flex-col gap-3 shrink-0">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search in reference..."
                            className="w-full bg-muted/50 border border-border rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                          />

                          {/* Floating Search Results */}
                          <AnimatePresence>
                            {searchTerm.trim() && (
                              <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="absolute left-0 right-0 top-full mt-2 bg-popover border border-border shadow-2xl rounded-lg z-[60] max-h-80 overflow-y-auto overflow-x-hidden flex flex-col p-1 gap-1 custom-scrollbar"
                              >
                                <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 sticky top-0 bg-popover z-10">
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                    {getSearchResults().length} matches found
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSearchTerm("")}
                                    className="h-4 w-4 p-0"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                                {getSearchResults().length === 0 ? (
                                  <div className="py-8 text-center text-xs text-muted-foreground italic">
                                    No matches found
                                  </div>
                                ) : (
                                  getSearchResults().map((s, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() => {
                                        scrollToMatch(s.id);
                                      }}
                                      className="w-full text-right p-3 rounded hover:bg-muted transition-colors border-b border-border/20 last:border-0"
                                    >
                                      <div className="flex justify-between items-center mb-1">
                                        <span className="text-[9px] font-bold text-primary uppercase bg-primary/10 px-1.5 rounded">
                                          Res {idx + 1}
                                        </span>
                                        <span className="text-[9px] text-muted-foreground opacity-50">
                                          Pos: {s.index}
                                        </span>
                                      </div>
                                      <span
                                        dir="rtl"
                                        className="font-arabic leading-relaxed block text-sm"
                                      >
                                        {s.snippet
                                          .split(
                                            new RegExp(`(${searchTerm})`, "gi"),
                                          )
                                          .map((part, i) =>
                                            part.toLowerCase() ===
                                            searchTerm.toLowerCase() ? (
                                              <mark
                                                key={i}
                                                className="bg-primary/20 rounded-sm px-0.5"
                                              >
                                                {part}
                                              </mark>
                                            ) : (
                                              part
                                            ),
                                          )}
                                      </span>
                                    </button>
                                  ))
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      <div
                        className="flex-1 overflow-y-auto p-4 scrollbar-hide text-right"
                        dir="rtl"
                      >
                        {loadingRef ? (
                          <div className="flex items-center justify-center py-10">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : (
                          <div className="font-arabic text-lg leading-loose whitespace-pre-wrap selection:bg-primary/20 pb-20">
                            {getHighlightedText(referenceText, searchTerm)}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  {activeTab === "community" && (
                      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                        <div className="text-xs text-muted-foreground mb-2 text-center border-b border-border/50 pb-2">
                          Ces transcriptions ont été soumises par d'autres
                          contributeurs pour cette ligne.
                        </div>
                        {(!segment?.other_transcriptions || segment.other_transcriptions.length === 0) ? (
                          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2 opacity-60">
                            <Users className="w-10 h-10 mb-2 opacity-50" />
                            <p className="text-sm font-semibold">
                              Soyez le premier !
                            </p>
                            <p className="text-xs text-center max-w-[200px]">
                              Personne n'a encore transcrit cette ligne. Votre
                              contribution est précieuse.
                            </p>
                          </div>
                        ) : (
                          segment.other_transcriptions?.map((t, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-lg border border-primary/20 bg-primary/5 shadow-sm flex flex-col gap-2"
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0 border border-primary/30">
                                    {t.profiles?.avatar_url ? (
                                      <img
                                        src={t.profiles.avatar_url}
                                        alt="Avatar"
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-[10px] font-bold text-primary">
                                        {t.profiles?.email
                                          ?.substring(0, 2)
                                          .toUpperCase() || "AN"}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-foreground">
                                      {t.profiles?.email?.split("@")[0] ||
                                        "Anonyme"}
                                    </span>
                                    {t.profiles?.role === "admin" && (
                                      <span className="text-[9px] text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-sm font-bold w-fit mt-0.5 border border-amber-500/20">
                                        ADMIN
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <p
                                className="text-lg font-arabic leading-relaxed text-right p-2 bg-background/80 rounded border border-border/50"
                                dir="rtl"
                              >
                                {t.text}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  {activeTab === "pdf" && segment?.manuscript_pdf_url && (
                    <div className="flex-1 overflow-hidden flex flex-col">
                      <iframe
                        src={segment.manuscript_pdf_url}
                        className="w-full h-full border-none"
                        title="Manuscript PDF"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {segment?.manuscript_id && (
        <ManuscriptNavigation
          manuscriptId={segment.manuscript_id}
          isOpen={isNavOpen}
          onClose={() => setIsNavOpen(false)}
          onSelectSegment={(sid) => {
            loadSegment(sid);
            setIsNavOpen(false);
          }}
          currentSegmentId={segment.id}
          currentPageId={segment.page_id}
          t={t}
        />
      )}
    </div>
  );
}
