"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  getNextSegment,
  submitTranscription,
  flagSegment,
  reportSegmentationIssue,
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
  SkipBack,
  Maximize,
  Send,
  AlertCircle,
  AlertTriangle,
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
  FileImage,
  FileText,
  Trophy,
  Zap,
  Flame,
  Star,
  Users,
  List,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { OnboardingModal } from "@/components/OnboardingModal";
import DraggableKeyboard from "@/components/DraggableKeyboard";
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
  segment_status?: string;
  consensus_text?: string;
  display_text?: string;
  is_read_only?: boolean;
  lock_reason?: "validated" | "already_submitted" | null;
  user_transcription?: {
    id: string;
    text: string;
    status: string;
    is_validated: boolean;
  } | null;
  validated_transcription?: {
    id: string;
    text: string;
    contributor_id: string;
  } | null;
  other_transcriptions?: {
    text: string;
    profiles: {
      email: string;
      avatar_url: string | null;
      role: string;
    };
  }[];
  segmentation_issue_reported?: boolean;
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

const normalizeArabicForSearch = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/\u0640/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه");

function buildArabicSearchIndex(value: string) {
  let normalized = "";
  const normalizedToOriginal: number[] = [];

  for (let i = 0; i < value.length; i++) {
    const normalizedChar = normalizeArabicForSearch(value[i]);
    if (!normalizedChar) continue;

    for (let j = 0; j < normalizedChar.length; j++) {
      normalized += normalizedChar[j];
      normalizedToOriginal.push(i);
    }
  }

  return { normalized, normalizedToOriginal };
}

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
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [showReferenceSearch, setShowReferenceSearch] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "reference" | "pdf" | "community"
  >("reference");
  const [activeReferenceMatch, setActiveReferenceMatch] = useState(0);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [isDraggingZoom, setIsDraggingZoom] = useState(false);
  const [reportingSegmentation, setReportingSegmentation] = useState(false);
  const [showSegmentationConfirm, setShowSegmentationConfirm] = useState(false);
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { t } = useLanguage();
  const { toast } = useToast();

  const loadSegment = useCallback(async (targetId?: string, afterId?: string, direction: 'next' | 'prev' = 'next') => {
    setLoading(true);
    setErrorObj(null);
    setText("");
    try {
      const nextSeg = await getNextSegment(manuscriptId, targetId, afterId, direction);
      setSegment(nextSeg as any);
      if (nextSeg?.id) {
        if ((nextSeg as any).display_text) {
          setText((nextSeg as any).display_text);
        } else {
          const saved = localStorage.getItem(`waraka_autosave_${nextSeg.id}`);
          if (saved) setText(saved);
        }
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

  useEffect(() => {
    if (segment?.is_read_only) {
      setShowKeyboard(false);
    }
  }, [segment?.id, segment?.is_read_only]);

  // Keyboard shortcuts removed as per user request (clic c tout)
  useEffect(() => {
    // Shortcuts were interfering with text editing
  }, []);

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
    if (
      segment?.id &&
      !segment.is_read_only &&
      !segment.user_transcription &&
      !loading &&
      !submitting
    ) {
      const delayDebounceFn = setTimeout(() => {
        if (text) {
          localStorage.setItem(`waraka_autosave_${segment.id}`, text);
        } else {
          localStorage.removeItem(`waraka_autosave_${segment.id}`);
        }
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [text, segment?.id, segment?.is_read_only, segment?.user_transcription, loading, submitting]);

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

  const resetZoom = useCallback(() => {
    setZoomScale(1);
    setZoomPos({ x: 0, y: 0 });
  }, []);

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

    // Pan after scale so the polygon center lands in the container center.
    const panX = (imgSize.width / 2 - polyCenterX) * renderScale * targetZoom;
    const panY = (imgSize.height / 2 - polyCenterY) * renderScale * targetZoom;

    setZoomScale(targetZoom);

    // On mobile, offset slightly up so keyboard doesn't cover if they type
    const yOffset = 0; // We return early on mobile now, so yOffset is 0.
    setZoomPos({ x: panX, y: panY + yOffset });
  }, [segment?.polygon, imgSize.width, imgSize.height, resetZoom]);

  const handlePageImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const natW = img.naturalWidth;
    const natH = img.naturalHeight;
    setImgSize({ width: natW, height: natH });
  };

  // Start every segment at the natural 100% page view.
  useEffect(() => {
    if (imgSize.width > 0 && segment?.id) {
      resetZoom();
    }
  }, [segment?.id, imgSize.width, resetZoom]);

  const handleSubmit = async () => {
    if (!segment || !text.trim() || isTranscriptionLocked) return;
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

    const currentId = segment.id;
    setIsEditing(null);
    await loadSegment(undefined, currentId, 'next');
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
    await loadSegment(undefined, segment?.id, 'next');
    fetchPendingCount();
    setSubmitting(false);
  };

  const handlePrevious = async () => {
    setSubmitting(true);
    await loadSegment(undefined, segment?.id, 'prev');
    fetchPendingCount();
    setSubmitting(false);
  };

  const handleFlag = async () => {
    if (!segment) return;
    const currentId = segment.id;
    setSubmitting(true);
    await flagSegment(segment.id);
    localStorage.removeItem(`waraka_autosave_${segment.id}`);
    toast({
      title: "Segment flagged",
      description: "Admin will review this segment.",
    });
    await loadSegment(undefined, currentId, 'next');
    fetchPendingCount();
    setSubmitting(false);
  };

  const handleReportSegmentationIssue = async () => {
    if (!segment) return;

    setShowSegmentationConfirm(false);
    setReportingSegmentation(true);
    const result = await reportSegmentationIssue(segment.id);

    if (result?.error) {
      toast({
        title: t("transcribe.segmentation_report_error"),
        description: result.error,
        variant: "destructive",
      });
    } else {
      setSegment((current) =>
        current?.id === segment.id
          ? { ...current, segmentation_issue_reported: true }
          : current,
      );
      toast({
        title: t("transcribe.segmentation_reported_title"),
        description: t("transcribe.segmentation_reported_desc"),
      });
    }

    setReportingSegmentation(false);
  };

  const handleKeyPress = (char: string) => {
    if (isTranscriptionLocked) return;
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
    if (isTranscriptionLocked) return;
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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 180);

    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const referenceSearchIndex = useMemo(
    () => buildArabicSearchIndex(referenceText),
    [referenceText],
  );

  const normalizedSearchTerm = debouncedSearchTerm.trim();
  const normalizedSearchNeedle = useMemo(
    () => normalizeArabicForSearch(normalizedSearchTerm).trim(),
    [normalizedSearchTerm],
  );

  const referenceMatches = useMemo(() => {
    if (!normalizedSearchNeedle || !referenceText) return [];

    const matches = [];
    let fromIndex = 0;

    while (fromIndex < referenceSearchIndex.normalized.length) {
      const normalizedIndex = referenceSearchIndex.normalized.indexOf(
        normalizedSearchNeedle,
        fromIndex,
      );

      if (normalizedIndex === -1) break;

      const originalStart =
        referenceSearchIndex.normalizedToOriginal[normalizedIndex] ?? 0;
      const originalEnd =
        (referenceSearchIndex.normalizedToOriginal[
          normalizedIndex + normalizedSearchNeedle.length - 1
        ] ?? originalStart) + 1;
      const snippetStart = Math.max(0, originalStart - 90);
      const snippetEnd = Math.min(referenceText.length, originalEnd + 90);

      matches.push({
        index: originalStart,
        id: matches.length,
        start: originalStart,
        end: originalEnd,
        snippet: referenceText.substring(snippetStart, snippetEnd),
        match: referenceText.substring(originalStart, originalEnd),
      });

      fromIndex = normalizedIndex + Math.max(1, normalizedSearchNeedle.length);
      if (matches.length > 250) break;
    }

    return matches;
  }, [normalizedSearchNeedle, referenceSearchIndex, referenceText]);

  useEffect(() => {
    setActiveReferenceMatch(0);
  }, [normalizedSearchNeedle, referenceText]);

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
  const isTranscriptionLocked = !!segment?.is_read_only;
  const lockNotice =
    segment?.lock_reason === "validated"
      ? t("transcribe.locked_validated")
      : segment?.lock_reason === "already_submitted"
        ? t("transcribe.locked_submitted")
        : "";

  const activeReferenceIndex =
    referenceMatches.length > 0
      ? Math.min(activeReferenceMatch, referenceMatches.length - 1)
      : 0;

  const getHighlightedText = (sourceText: string) => {
    if (referenceMatches.length === 0) {
      return <span id="reference-content">{sourceText}</span>;
    }

    const parts = [];
    let lastIndex = 0;

    referenceMatches.forEach((match, matchIndex) => {
      if (match.start > lastIndex) {
        parts.push(sourceText.slice(lastIndex, match.start));
      }

      parts.push(
        <mark
          key={`match-${matchIndex}`}
          id={`reference-match-${matchIndex}`}
          className={`rounded-sm px-0.5 scroll-mt-24 transition-colors ${
            activeReferenceIndex === matchIndex
              ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
              : "bg-primary/25 text-foreground ring-1 ring-primary/15"
          }`}
        >
          {sourceText.slice(match.start, match.end)}
        </mark>,
      );

      lastIndex = match.end;
    });

    if (lastIndex < sourceText.length) {
      parts.push(sourceText.slice(lastIndex));
    }

    return (
      <span id="reference-content">
        {parts.map((part, i) =>
          typeof part === "string" ? <span key={`text-${i}`}>{part}</span> : part,
        )}
      </span>
    );
  };

  const scrollToMatch = (id: number) => {
    setActiveReferenceMatch(id);
    requestAnimationFrame(() => {
      const mark = document.getElementById(`reference-match-${id}`);
      mark?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const moveReferenceMatch = (direction: "prev" | "next") => {
    if (referenceMatches.length === 0) return;
    const nextIndex =
      direction === "next"
        ? (activeReferenceIndex + 1) % referenceMatches.length
        : (activeReferenceIndex - 1 + referenceMatches.length) %
          referenceMatches.length;
    scrollToMatch(nextIndex);
  };

  const currentReferenceMatch =
    referenceMatches[activeReferenceIndex] || referenceMatches[0];

  const topBadges = gamification?.badges?.slice(0, 6) || [];

  return (
    <div className="flex flex-col w-full h-[calc(100dvh-64px)] animate-in fade-in duration-500 overflow-hidden bg-background">
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

      {/* Header Area */}
      <div className="w-full flex flex-col sm:flex-row justify-between items-center px-4 py-2 border-b border-border/50 shrink-0 bg-background/50 backdrop-blur-sm z-30 gap-2 min-h-[52px]">
        <div className="flex items-center gap-3 min-w-0">
          {/* Sidebar Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (window.innerWidth < 1024) {
                setIsNavOpen(true);
              } else {
                setIsSidebarOpen((open) => !open);
              }
            }}
            className={`h-9 px-3 gap-2 rounded-lg transition-colors border shrink-0 ${isSidebarOpen ? 'bg-primary/10 text-primary border-primary/20' : 'text-muted-foreground border-border/50 hover:bg-muted'}`}
            title={isSidebarOpen ? t("transcribe.close_navigation") : t("transcribe.open_navigation")}
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-semibold">
              {isSidebarOpen ? t("transcribe.close_navigation") : t("transcribe.open_navigation")}
            </span>
          </Button>

          {/* Combined Segment & Manuscript Info */}
          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground bg-muted/30 px-2.5 py-1.5 rounded-full border border-border/50 group relative">
            <span className="text-primary px-1.5 py-0.5 rounded-full bg-primary/10">
              #{segment?.order_index || "..."}
            </span>
            <span className="max-w-[120px] sm:max-w-[400px] truncate leading-tight">
              {title}
            </span>
            {segment?.page_label && (
              <span className="text-primary/70 font-bold border-l border-border/50 pl-2">
                {segment.page_label}
              </span>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[10px] text-muted-foreground ml-2">
             <div className={`w-1.5 h-1.5 rounded-full ${isOffline ? "bg-amber-500" : "bg-emerald-500 animate-pulse"}`} />
             <span>{sessionCount} segments</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {gamification && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-700 px-2.5 py-1 rounded-full border border-amber-500/20 shadow-sm cursor-pointer hover:bg-amber-500/20 transition-colors"
                   onClick={() => setShowGamification(!showGamification)}>
                <Zap className="w-3 h-3" />
                <span className="text-[10px] font-bold leading-none">
                  {gamification.points}
                </span>
                <ChevronRight className={`w-2.5 h-2.5 transition-transform duration-300 ${showGamification ? "rotate-90" : ""}`} />
              </div>
            </div>
          )}
          
          <div className="h-4 w-[1px] bg-border mx-1 hidden sm:block" />

          {segment?.manuscript_pdf_url && (
            <Button
              variant={activeTab === "pdf" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("pdf")}
              className="h-8 w-8 p-0 rounded-full text-red-600 hover:bg-red-50 hidden sm:flex border border-transparent hover:border-red-200"
              title="Ouvrir le PDF"
            >
              <BookOpen className="w-4 h-4" />
            </Button>
          )}

          <div className="hidden xl:flex items-center gap-1 text-[9px] text-muted-foreground/60 bg-muted/20 px-2 py-1 rounded-full border border-border/30">
            <kbd className="font-mono opacity-70">Ctrl</kbd>+<kbd className="font-mono opacity-70">Enter</kbd>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {gamification && showGamification && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full border-b border-border/50 bg-muted/20 px-4 py-3 shrink-0 overflow-hidden"
          >
            <div className="flex flex-col md:flex-row gap-4 max-w-7xl mx-auto">
              {/* Level Progress */}
              <div className="flex-1 min-w-[200px]">
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                   <span>Niveau {gamification.level.level} — {gamification.level.levelName}</span>
                   <span>{gamification.level.progressPct}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${gamification.level.progressPct}%` }}
                  />
                </div>
              </div>

              {/* Next Badge or Boosts */}
              <div className="flex-1 min-w-[200px] border-l border-border/50 pl-4 hidden md:block">
                {gamification.nextBadge ? (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                      <Star className="w-4 h-4 text-secondary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold truncate">{gamification.nextBadge.name}</p>
                      <p className="text-[9px] text-muted-foreground truncate">{gamification.nextBadge.description}</p>
                    </div>
                  </div>
                ) : (
                   <p className="text-[10px] text-muted-foreground">Tous les badges débloqués !</p>
                )}
              </div>

              {/* Active Boosts */}
              <div className="flex-1 min-w-[200px] border-l border-border/50 pl-4 hidden lg:block">
                 <div className="flex flex-wrap gap-2">
                    {gamification.boosts.length > 0 ? (
                      gamification.boosts.map((boost) => (
                        <span key={boost.slug} className="text-[9px] font-bold bg-amber-500/10 text-amber-700 px-2 py-0.5 rounded-full border border-amber-500/20">
                           {boost.label}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-muted-foreground">Aucun boost actif</span>
                    )}
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex flex-1 gap-0 pt-0 min-h-0 relative overflow-hidden">
        {/* Sidebar Navigation */}
        <AnimatePresence>
          {isSidebarOpen && segment?.manuscript_id && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="hidden lg:block shrink-0 border-r border-border/50 bg-background overflow-hidden"
            >
              <div className="w-[320px] h-full">
                <ManuscriptNavigation
                  manuscriptId={segment.manuscript_id}
                  isOpen={true}
                  onClose={() => {}}
                  onSelectSegment={(sid) => loadSegment(sid)}
                  currentSegmentId={segment.id}
                  currentPageId={segment.page_id}
                  t={t}
                  isSidebar={true}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content: Image Left, Transcription Right */}
        <div className="flex-1 flex flex-col lg:flex-row min-w-0 bg-background overflow-hidden relative">
          {/* Image Area — 65% width on large screens */}
          <div
            ref={imageContainerRef}
            className="w-full h-[38dvh] min-h-[220px] sm:h-[42dvh] lg:h-full lg:flex-1 lg:min-w-0 sticky top-0 lg:relative lg:top-auto z-20 flex flex-col justify-center items-center bg-[#F3EFE9] border-b lg:border-b-0 lg:border-r border-border/50 overflow-hidden cursor-crosshair shadow-md lg:shadow-inner shrink-0"
            onWheel={handleSegmentWheel}
            onMouseDown={handleSegmentMouseDown}
          >
            {loading && (
              <div className="absolute inset-0 z-50 bg-background/40 backdrop-blur-[2px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 bg-background/80 px-6 py-4 rounded-2xl shadow-xl border border-border/50">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="text-xs font-bold text-primary uppercase tracking-widest">{t("transcribe.loading") || "Chargement..."}</span>
                </div>
              </div>
            )}
        <div
          className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-out select-none"
          style={{
            transform: `translate(${zoomPos.x}px, ${zoomPos.y}px) scale(${zoomScale})`,
            transformOrigin: "center",
          }}
        >
          {/* Mobile view: crop segment only */}
          {segment?.image_url && (
            <img
              src={segment.image_url}
              alt="Segment Crop"
              className="lg:hidden max-h-[90%] max-w-[95%] object-contain drop-shadow-xl rounded-sm"
              draggable={false}
            />
          )}

          {/* Desktop view: full page manuscript with polygon overlay */}
          {segment?.page_image_url ? (
            <div className="hidden lg:block relative">
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
                    <rect
                      width={imgSize.width}
                      height={imgSize.height}
                      fill="rgba(0,0,0,0.5)"
                      mask="url(#seg-mask)"
                    />
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
              src={segment.image_url}
              alt="Segment"
              className="hidden lg:block max-h-full max-w-full object-contain drop-shadow-2xl rounded-sm"
              draggable={false}
            />
          ) : null}
        </div>

            <div className="absolute top-3 left-3 z-30 select-none flex gap-2">
              <div className="flex items-center gap-1.5 bg-background/90 backdrop-blur shadow-sm border border-border px-2.5 py-1.5 rounded-full pointer-events-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[9px] font-bold text-primary hover:bg-primary/5 rounded-full lg:hidden"
                  onClick={() => setShowContext(true)}
                >
                  <ImageIcon className="w-3 h-3 mr-1" /> Voir la page
                </Button>
                {segment?.polygon && Array.isArray(segment.polygon) && (
                  <Button
                    variant={zoomScale === 1 ? "default" : "outline"}
                    size="sm"
                    className={`h-6 px-2 text-[9px] font-bold rounded-full flex items-center gap-1 transition-all ${zoomScale === 1 ? 'bg-primary text-primary-foreground' : 'text-primary bg-background hover:bg-primary/5'}`}
                    onClick={centerOnSegment}
                    title={t("transcribe.zoom_line")}
                  >
                    <Maximize className="w-3 h-3" /> {t("transcribe.zoom_line")}
                  </Button>
                )}
                {zoomScale !== 1 && (
                  <button
                    onClick={resetZoom}
                    className="text-[9px] font-bold text-primary hover:underline px-1 border-l border-border/50 ml-1"
                  >
                    {Math.round(zoomScale * 100)}% ({t("transcribe.reset_zoom")})
                  </button>
                )}
              </div>
            </div>

            {/* Zoom Hint */}
            <div className="absolute bottom-3 right-3 text-[9px] text-muted-foreground opacity-40 select-none flex items-center gap-2 pointer-events-none">
              <Search className="w-3 h-3" />
              {t("transcribe.zoom_hint")}
            </div>
          </div>

          {/* Transcription Area — Smaller width on large screens to give space to manuscript */}
          <div className="flex-1 lg:flex-none lg:w-[490px] xl:w-[540px] 2xl:w-[575px] flex flex-col p-4 lg:px-5 xl:px-6 lg:pb-6 lg:pt-6 gap-4 overflow-y-auto lg:overflow-hidden relative z-10 bg-background">
            <div className="flex justify-between items-center shrink-0 border-b border-border/40 pb-3">
              <h2
                className="text-lg font-heading font-bold text-foreground/80 tracking-tight"
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
                  disabled={isTranscriptionLocked}
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

            {isTranscriptionLocked && lockNotice && (
              <div className="bg-muted/70 text-muted-foreground text-[11px] p-3 rounded-lg flex items-start gap-2 border border-border shrink-0">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                <span>{lockNotice}</span>
              </div>
            )}

            {hasNonArabic && !isTranscriptionLocked && (
              <div className="bg-orange-500/10 text-orange-600 text-[10px] p-2 rounded flex items-center gap-2 border border-orange-500/20 shrink-0">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                <span>{t("transcribe.non_arabic")}</span>
              </div>
            )}

            <div className="flex-1 w-full relative min-h-0 flex flex-col gap-2">
              <div className="flex items-center gap-2 px-1">
                 <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                 <p className="text-[10px] font-medium text-muted-foreground italic">
                    Note: Pas besoin de diacritiques (voyelles), mais ce n'est pas grave si vous en mettez.
                 </p>
              </div>
              <Textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t("transcribe.placeholder")}
                dir="rtl"
                lang="ar"
                disabled={submitting || loading || isTranscriptionLocked}
                className={`resize-none h-32 min-h-[120px] shrink-0 font-arabic text-2xl leading-[2] border-border shadow-inner focus-visible:ring-primary p-4 rounded-xl !outline-none focus:border-primary/50 ${
                  isTranscriptionLocked
                    ? "bg-muted/60 text-muted-foreground cursor-not-allowed border-dashed"
                    : "bg-[#FAF7F2] text-foreground"
                }`}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowSegmentationConfirm(true)}
                disabled={
                  !segment ||
                  reportingSegmentation ||
                  segment.segmentation_issue_reported
                }
                className="h-9 justify-start gap-2 border-amber-500/30 bg-amber-500/5 text-amber-700 hover:bg-amber-500/10"
                title={t("transcribe.segmentation_report_title")}
              >
                {reportingSegmentation ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
                <span className="truncate">
                  {segment?.segmentation_issue_reported
                    ? t("transcribe.segmentation_reported_button")
                    : t("transcribe.segmentation_report_button")}
                </span>
              </Button>

              <AnimatePresence>
                {showKeyboard && !isTranscriptionLocked && (
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
                  disabled={submitting || loading || !text.trim() || isTranscriptionLocked}
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
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={submitting}
                      className="h-12 px-4 font-medium"
                      title={t("transcribe.prev_title") || "Précédent"}
                    >
                      <SkipBack className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleSkip}
                      disabled={submitting}
                      className="h-12 px-4 font-medium"
                      title={t("transcribe.skip_title")}
                    >
                      <SkipForward className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Tabs Area Below Textarea */}
              <div className="flex-1 min-h-0 mt-4 border border-border rounded-xl bg-card overflow-hidden flex flex-col shadow-sm">
                {/* Tabs Header */}
                <div className="flex border-b border-border shrink-0">
                  <button
                    onClick={() => setActiveTab("reference")}
                    className={`flex-1 py-3 text-xs font-bold flex flex-col items-center gap-1 transition-colors ${activeTab === "reference" ? "text-primary bg-primary/5 border-b-2 border-primary" : "text-muted-foreground hover:bg-muted"}`}
                  >
                    <BookOpen className="w-4 h-4" /> {t("transcribe.reference_tab")}
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
                    {t("transcribe.community_tab")}
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
                      <div className="p-4 border-b border-border flex flex-col gap-3 shrink-0 bg-muted/10">
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 h-8 w-8 rounded-lg border border-primary/20 bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground">
                              {t("transcribe.reference_title")}
                            </p>
                            <p className="text-[11px] leading-snug text-muted-foreground">
                              {t("transcribe.reference_desc")}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          onClick={() => setShowReferenceSearch(true)}
                          className="h-10 justify-start gap-2"
                          disabled={loadingRef}
                        >
                          <Search className="w-4 h-4" />
                          {t("transcribe.reference_open_search")}
                        </Button>
                      </div>

                      <div
                        className="flex-1 overflow-y-auto p-4 text-right"
                      >
                        {loadingRef ? (
                          <div className="flex items-center justify-center py-10">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : !referenceText ? (
                          <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                            <FileText className="w-10 h-10 opacity-40" />
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {t("transcribe.reference_empty_title")}
                              </p>
                              <p className="mx-auto mt-1 max-w-[280px] text-xs leading-relaxed">
                                {t("transcribe.reference_empty_desc")}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 text-center">
                            <Search className="w-10 h-10 text-primary/50" />
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {t("transcribe.reference_popup_hint_title")}
                              </p>
                              <p className="mx-auto mt-1 max-w-[300px] text-xs leading-relaxed text-muted-foreground">
                                {t("transcribe.reference_popup_hint_desc")}
                              </p>
                            </div>
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

      <AnimatePresence>
        {showReferenceSearch && (
          <motion.div
            initial={{ opacity: 0, x: 28, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 28, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="fixed z-[85] left-3 right-3 top-20 bottom-3 lg:left-auto lg:right-5 lg:w-[560px] xl:w-[620px] rounded-xl border border-border bg-background/98 shadow-2xl backdrop-blur flex flex-col overflow-hidden"
          >
            <div className="flex items-start justify-between gap-3 border-b border-border p-4 bg-muted/20">
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">
                  {t("transcribe.reference_title")}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {t("transcribe.reference_popup_desc")}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReferenceSearch(false)}
                className="h-8 w-8 p-0 rounded-full shrink-0"
                title={t("transcribe.reference_close")}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="border-b border-border p-4 flex flex-col gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t("transcribe.reference_search_placeholder")}
                  dir="auto"
                  autoFocus
                  className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-1.5 top-1.5 h-7 w-7 p-0"
                    title={t("transcribe.reference_clear")}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  {normalizedSearchTerm
                    ? t("transcribe.reference_matches", {
                        count: referenceMatches.length,
                      })
                    : t("transcribe.reference_ready")}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => moveReferenceMatch("prev")}
                    disabled={referenceMatches.length === 0}
                    className="h-8 w-8 p-0"
                    title={t("transcribe.reference_prev")}
                  >
                    <SkipBack className="w-3.5 h-3.5" />
                  </Button>
                  <span className="min-w-14 text-center text-[11px] font-bold text-primary">
                    {referenceMatches.length > 0
                      ? `${activeReferenceIndex + 1}/${referenceMatches.length}`
                      : "0/0"}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => moveReferenceMatch("next")}
                    disabled={referenceMatches.length === 0}
                    className="h-8 w-8 p-0"
                    title={t("transcribe.reference_next")}
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {normalizedSearchTerm && referenceMatches.length === 0 && (
                <p className="rounded-md border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-700">
                  {t("transcribe.reference_no_matches")}
                </p>
              )}

              {currentReferenceMatch && (
                <button
                  type="button"
                  onClick={() => scrollToMatch(currentReferenceMatch.id)}
                  className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-right hover:bg-primary/10 transition-colors"
                >
                  <span className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-primary">
                    {t("transcribe.reference_active_match")} #{activeReferenceIndex + 1}
                  </span>
                  <span dir="rtl" className="block font-arabic text-sm leading-relaxed text-foreground">
                    {currentReferenceMatch.snippet}
                  </span>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-5 text-right" dir="rtl">
              {loadingRef ? (
                <div className="flex h-full min-h-[220px] items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : !referenceText ? (
                <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                  <FileText className="w-10 h-10 opacity-40" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {t("transcribe.reference_empty_title")}
                    </p>
                    <p className="mx-auto mt-1 max-w-[300px] text-xs leading-relaxed">
                      {t("transcribe.reference_empty_desc")}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="font-arabic text-lg leading-loose whitespace-pre-wrap selection:bg-primary/20 pb-10">
                  {getHighlightedText(referenceText)}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSegmentationConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              className="w-full max-w-md rounded-xl border border-border bg-background shadow-2xl p-5"
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-700 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-heading text-lg font-semibold">
                    {t("transcribe.segmentation_confirm_title")}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {t("transcribe.segmentation_confirm_desc")}
                  </p>
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSegmentationConfirm(false)}
                  disabled={reportingSegmentation}
                >
                  {t("transcribe.cancel")}
                </Button>
                <Button
                  onClick={handleReportSegmentationIssue}
                  disabled={reportingSegmentation}
                  className="gap-2 bg-amber-600 hover:bg-amber-700"
                >
                  {reportingSegmentation && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  {t("transcribe.segmentation_confirm_action")}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Full Page Context Popup */}
      <AnimatePresence>
        {showContext && segment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col p-4 md:p-8"
          >
            <div className="flex justify-between items-center mb-4 text-white">
              <div className="flex items-center gap-3">
                <div className="bg-primary p-2 rounded-lg">
                  <ImageIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg leading-tight">{title}</h3>
                  <p className="text-xs text-white/60">Page {segment.page_label} — Vue d'ensemble</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowContext(false)}
                className="text-white hover:bg-white/10 rounded-full h-10 w-10 p-0"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
            
            <div className="flex-1 relative rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
              {segment.page_image_url && (
                <div className="relative w-full h-full flex items-center justify-center group p-4">
                  <Zoom>
                    <div className="relative">
                      <img
                        src={segment.page_image_url}
                        alt="Full Page Context"
                        className="max-h-[85vh] max-w-full object-contain rounded shadow-2xl"
                      />
                      {segment.polygon && imgSize.width > 0 && (
                        <svg
                          viewBox={`0 0 ${imgSize.width} ${imgSize.height}`}
                          className="absolute inset-0 w-full h-full pointer-events-none"
                          preserveAspectRatio="xMidYMid meet"
                        >
                          <polygon
                            points={segment.polygon.map((p: any) => `${p.x},${p.y}`).join(" ")}
                            fill="rgba(255,200,0,0.15)"
                            stroke="rgba(255,180,0,1)"
                            strokeWidth={Math.max(4, imgSize.width / 150)}
                          />
                        </svg>
                      )}
                    </div>
                  </Zoom>
                  <div className="absolute inset-x-0 bottom-4 flex justify-center pointer-events-none">
                    <span className="bg-black/40 backdrop-blur px-3 py-1.5 rounded-full text-[10px] text-white/80 font-medium">
                      Cliquez pour zoomer ou déplacez l'image
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile-only Sheet Navigation (keep for mobile since sidebar is hidden) */}
      <ManuscriptNavigation
          manuscriptId={segment?.manuscript_id || ''}
          isOpen={isNavOpen}
          onClose={() => setIsNavOpen(false)}
          onSelectSegment={(sid) => {
            loadSegment(sid);
            setIsNavOpen(false);
          }}
          currentSegmentId={segment?.id}
          currentPageId={segment?.page_id}
          t={t}
        />
    </div>
  );
}
