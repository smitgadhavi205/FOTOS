import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Share2,
  CheckCircle2,
  Circle,
  DownloadCloud,
  Loader2,
  Star,
  Copy,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export interface GalleryImage {
  id: string;
  image_url: string;
  created_at?: string;
}

interface InteractiveGalleryProps {
  images: GalleryImage[];
  eventName?: string;
  emptyLabel?: string;
}

const LONG_PRESS_MS = 450;
const SESSION_KEY = "mypic-guest-session";

function getSessionId() {
  if (typeof window === "undefined") return "server";
  let s = localStorage.getItem(SESSION_KEY);
  if (!s) {
    s = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(SESSION_KEY, s);
  }
  return s;
}

// Varied hover behaviors keep the grid feeling alive without extra libraries.
const HOVER_VARIANTS = [
  "group-hover:scale-110",
  "group-hover:scale-105 group-hover:rotate-1",
  "group-hover:scale-105 group-hover:-rotate-1",
  "group-hover:scale-110 group-hover:brightness-110",
  "group-hover:scale-[1.08] group-hover:saturate-150",
];

/** Serve resized/optimized variants from storage instead of multi-MB originals. */
function transformed(url: string, width: number, quality = 65) {
  if (!url.includes("/storage/v1/object/public/")) return url;
  return (
    url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/") +
    `?width=${width}&quality=${quality}&resize=contain`
  );
}

const prefetched = new Set<string>();
/** Warm the browser cache so an image is already decoded before it is displayed. */
function prefetch(url: string) {
  if (typeof window === "undefined" || prefetched.has(url)) return;
  prefetched.add(url);
  const img = new Image();
  img.decoding = "async";
  img.src = url;
}

function dayKey(value?: string) {
  const date = value ? new Date(value) : new Date(0);
  return Number.isNaN(date.getTime()) ? "unknown" : date.toLocaleDateString("en-CA");
}

function dayLabel(value?: string) {
  if (!value) return "Earlier photos";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Earlier photos";
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const difference = Math.round((startToday - startDate) / 86_400_000);
  if (difference === 0) return "Today";
  if (difference === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

async function fetchAsBlob(url: string) {
  const res = await fetch(url);
  return await res.blob();
}

async function downloadOne(url: string, filename: string) {
  const blob = await fetchAsBlob(url);
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}

interface RatingInfo {
  avg: number;
  count: number;
  mine: number;
}

interface ShareTarget {
  url: string;
  title: string;
}

export function InteractiveGallery({
  images,
  eventName = "event",
  emptyLabel = "No photos yet",
}: InteractiveGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isBusy, setIsBusy] = useState(false);
  const [loadedIds, setLoadedIds] = useState<Set<string>>(new Set());
  const [fullLoadedIds, setFullLoadedIds] = useState<Set<string>>(new Set());
  const markLoaded = useCallback((id: string) => {
    setLoadedIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);
  const markFullLoaded = useCallback((id: string) => {
    setFullLoadedIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);


  const [ratings, setRatings] = useState<Record<string, RatingInfo>>({});
  const [hoverStar, setHoverStar] = useState<{ id: string; val: number } | null>(null);
  const [shareTarget, setShareTarget] = useState<ShareTarget | null>(null);
  const pressTimer = useRef<number | null>(null);
  const longPressTriggered = useRef(false);
  const lightboxHistoryPushed = useRef(false);
  const sessionId = useMemo(() => getSessionId(), []);

  // Load ratings for these images
  useEffect(() => {
    if (!images.length) return;
    (async () => {
      const ids = images.map((i) => i.id);
      const { data, error } = await supabase
        .from("image_ratings")
        .select("image_id, rating, session_id")
        .in("image_id", ids);
      if (error) return;
      const agg: Record<string, RatingInfo> = {};
      for (const id of ids) agg[id] = { avg: 0, count: 0, mine: 0 };
      for (const row of data || []) {
        const r = agg[row.image_id];
        if (!r) continue;
        r.avg = (r.avg * r.count + row.rating) / (r.count + 1);
        r.count += 1;
        if (row.session_id === sessionId) r.mine = row.rating;
      }
      setRatings(agg);
    })();
  }, [images, sessionId]);

  const submitRating = async (imageId: string, rating: number) => {
    const prev = ratings[imageId] || { avg: 0, count: 0, mine: 0 };
    // Optimistic
    const wasMine = prev.mine;
    const nextCount = wasMine ? prev.count : prev.count + 1;
    const nextAvg = wasMine
      ? (prev.avg * prev.count - wasMine + rating) / prev.count
      : (prev.avg * prev.count + rating) / nextCount;
    setRatings((r) => ({ ...r, [imageId]: { avg: nextAvg, count: nextCount, mine: rating } }));

    const { error } = await supabase
      .from("image_ratings")
      .upsert(
        { image_id: imageId, session_id: sessionId, rating },
        { onConflict: "image_id,session_id" }
      );
    if (error) {
      toast({ title: "Rating failed", description: error.message, variant: "destructive" });
      setRatings((r) => ({ ...r, [imageId]: prev }));
    } else {
      toast({ title: "Thanks!", description: `You rated this photo ${rating} / 5.` });
    }
  };

  const clearPressTimer = () => {
    if (pressTimer.current) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const startPress = (id: string) => {
    longPressTriggered.current = false;
    clearPressTimer();
    pressTimer.current = window.setTimeout(() => {
      longPressTriggered.current = true;
      setSelectionMode(true);
      setSelected((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      if ("vibrate" in navigator) navigator.vibrate?.(30);
    }, LONG_PRESS_MS);
  };

  const cancelPress = () => clearPressTimer();

  const handleClick = (index: number, id: string) => {
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }
    if (selectionMode) toggleSelect(id);
    else {
      window.history.pushState({ ...window.history.state, mypicLightbox: true }, "");
      lightboxHistoryPushed.current = true;
      setLightboxIndex(index);
    }
  };

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
    if (lightboxHistoryPushed.current) {
      lightboxHistoryPushed.current = false;
      window.history.back();
    }
  }, []);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (next.size === 0) setSelectionMode(false);
      return next;
    });
  };

  const exitSelection = () => {
    setSelectionMode(false);
    setSelected(new Set());
  };

  const selectAll = () => setSelected(new Set(images.map((i) => i.id)));

  const goNext = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : Math.min(i + 1, images.length - 1)));
  }, [images.length]);
  const goPrev = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : Math.max(i - 1, 0)));
  }, []);

  // ---- Transform-driven swipe track (compositor-only, no layout work during touchmove) ----
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const indexRef = useRef<number | null>(null);
  const prevIndexRef = useRef<number | null>(null);
  const drag = useRef({
    startX: 0,
    startY: 0,
    dx: 0,
    axis: null as null | "x" | "y",
    startT: 0,
    raf: 0,
  });

  const applyTransform = useCallback((dx: number, animate: boolean) => {
    const track = trackRef.current;
    const idx = indexRef.current;
    if (!track || idx === null) return;
    const activeSlide = track.children.item(idx);
    if (!(activeSlide instanceof HTMLElement)) return;
    track.style.transition = animate ? "transform 260ms cubic-bezier(.2,.8,.2,1)" : "none";
    track.style.transform = `translate3d(${-activeSlide.offsetLeft + dx}px, 0, 0)`;
  }, []);

  // Snap to the active slide whenever the index changes (no animation on first open).
  useEffect(() => {
    indexRef.current = lightboxIndex;
    if (lightboxIndex === null) {
      prevIndexRef.current = null;
      return;
    }
    const firstOpen = prevIndexRef.current === null;
    prevIndexRef.current = lightboxIndex;
    applyTransform(0, !firstOpen);
  }, [lightboxIndex, applyTransform]);

  // Keep the track aligned whenever the actual viewer width changes.
  useEffect(() => {
    if (lightboxIndex === null) return;
    const viewer = viewerRef.current;
    if (!viewer) return;
    const onResize = () => applyTransform(0, false);
    const observer = new ResizeObserver(onResize);
    observer.observe(viewer);
    window.addEventListener("orientationchange", onResize);
    // Lock page scroll so the website behind the viewer is never visible.
    const prevOverflow = document.body.style.overflow;
    const prevOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    return () => {
      observer.disconnect();
      window.removeEventListener("orientationchange", onResize);
      document.body.style.overflow = prevOverflow;
      document.body.style.overscrollBehavior = prevOverscroll;
    };
  }, [lightboxIndex, applyTransform]);

  const onSwipeStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    drag.current = { startX: t.clientX, startY: t.clientY, dx: 0, axis: null, startT: performance.now(), raf: 0 };
    if (trackRef.current) trackRef.current.style.transition = "none";
  };

  const onSwipeMove = (e: React.TouchEvent) => {
    const d = drag.current;
    const t = e.touches[0];
    const dx = t.clientX - d.startX;
    const dy = t.clientY - d.startY;
    if (d.axis === null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      d.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    }
    if (d.axis !== "x") return;
    const idx = indexRef.current ?? 0;
    const atEdge = (idx === 0 && dx > 0) || (idx === images.length - 1 && dx < 0);
    d.dx = atEdge ? dx * 0.35 : dx; // rubber-band at the ends
    if (!d.raf) {
      d.raf = requestAnimationFrame(() => {
        d.raf = 0;
        applyTransform(d.dx, false);
      });
    }
  };

  const onSwipeEnd = () => {
    const d = drag.current;
    if (d.raf) {
      cancelAnimationFrame(d.raf);
      d.raf = 0;
    }
    if (d.axis !== "x") return;
    const w = viewerRef.current?.clientWidth || 1;
    const velocity = d.dx / Math.max(1, performance.now() - d.startT); // px per ms
    const idx = indexRef.current ?? 0;
    let next = idx;
    if (Math.abs(d.dx) > w * 0.2 || Math.abs(velocity) > 0.5) {
      next = d.dx < 0 ? Math.min(idx + 1, images.length - 1) : Math.max(idx - 1, 0);
    }
    d.axis = null;
    if (next === idx) applyTransform(0, true);
    else {
      if ("vibrate" in navigator) navigator.vibrate?.(8);
      setLightboxIndex(next);
    }
  };


  // Pre-download the neighbouring full-size photos so swiping is instant.
  useEffect(() => {
    if (lightboxIndex === null) return;
    [1, -1, 2, -2, 3].forEach((offset) => {
      const img = images[lightboxIndex + offset];
      if (img) prefetch(transformed(img.image_url, 1280, 78));
    });
  }, [lightboxIndex, images]);

  // Once the grid is idle, quietly warm the full-size versions of the first photos.
  useEffect(() => {
    if (!images.length) return;
    const warm = () => images.slice(0, 12).forEach((img) => prefetch(transformed(img.image_url, 1280, 78)));
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    const id = w.requestIdleCallback ? w.requestIdleCallback(warm) : window.setTimeout(warm, 1200);
    return () => window.clearTimeout(id as number);
  }, [images]);


  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, goNext, goPrev, closeLightbox]);

  // Give the native mobile Back button first priority to close the photo viewer.
  useEffect(() => {
    const onPopState = () => {
      if (indexRef.current === null) return;
      lightboxHistoryPushed.current = false;
      setLightboxIndex(null);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const downloadSelected = async () => {
    const items = images.filter((i) => selected.has(i.id));
    if (!items.length) return;
    setIsBusy(true);
    toast({ title: "Downloading", description: `Downloading ${items.length} photo${items.length > 1 ? "s" : ""}...` });
    try {
      for (let i = 0; i < items.length; i++) {
        await downloadOne(items[i].image_url, `${eventName}-${items[i].id}.jpg`);
        await new Promise((r) => setTimeout(r, 250));
      }
      toast({ title: "Download complete", description: `Saved ${items.length} photo${items.length > 1 ? "s" : ""}.` });
      exitSelection();
    } catch {
      toast({ title: "Download failed", description: "Some photos could not be downloaded.", variant: "destructive" });
    } finally {
      setIsBusy(false);
    }
  };

  const openShareDialog = (url: string, title: string) => setShareTarget({ url, title });

  const shareSelected = () => {
    const items = images.filter((i) => selected.has(i.id));
    if (!items.length) return;
    const combined = items.map((i) => i.image_url).join("\n");
    openShareDialog(combined, `${eventName} — ${items.length} photos`);
  };

  if (!images.length) {
    return <p className="text-muted-foreground text-center py-8">{emptyLabel}</p>;
  }

  const current = lightboxIndex !== null ? images[lightboxIndex] : null;
  const currentRating = current ? ratings[current.id] : undefined;
  const dayGroups = images.reduce<Array<{ key: string; label: string; items: Array<{ image: GalleryImage; index: number }> }>>(
    (groups, image, index) => {
      const key = dayKey(image.created_at);
      const last = groups[groups.length - 1];
      if (last?.key === key) last.items.push({ image, index });
      else groups.push({ key, label: dayLabel(image.created_at), items: [{ image, index }] });
      return groups;
    },
    []
  );

  return (
    <>
      {selectionMode && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-card/95 backdrop-blur px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-gold animate-in slide-in-from-bottom-4 duration-200 sm:static sm:mb-4 sm:rounded-xl sm:border sm:pb-3 sm:shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button onClick={exitSelection} className="p-2 rounded-md hover:bg-secondary active:scale-90 transition-transform text-foreground" aria-label="Cancel selection">
                <X className="w-5 h-5" />
              </button>
              <span className="font-medium text-foreground">{selected.size} selected</span>
              <button onClick={selectAll} className="text-sm text-accent hover:underline">Select all</button>
            </div>
            <div className="flex flex-1 items-center gap-2 sm:flex-none">
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={shareSelected} disabled={!selected.size || isBusy}>
                <Share2 className="w-4 h-4 mr-2" /> Share
              </Button>
              <Button variant="gold" size="sm" className="flex-1 sm:flex-none" onClick={downloadSelected} disabled={!selected.size || isBusy}>
                {isBusy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <DownloadCloud className="w-4 h-4 mr-2" />}
                Download
              </Button>
            </div>
          </div>
        </div>
      )}


      <div className="space-y-8">
        {dayGroups.map((group) => (
          <section key={group.key} aria-labelledby={`photos-${group.key}`}>
            <div className="mb-3 flex items-center gap-3">
              <h3 id={`photos-${group.key}`} className="font-display text-base sm:text-lg font-semibold text-foreground">
                {group.label}
              </h3>
              <span className="text-xs text-muted-foreground">
                {group.items.length} photo{group.items.length === 1 ? "" : "s"}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {group.items.map(({ image, index }) => {
          const isSelected = selected.has(image.id);
          const hover = HOVER_VARIANTS[index % HOVER_VARIANTS.length];
          return (
            <div
              key={image.id}
              className={`group relative aspect-square rounded-xl overflow-hidden bg-secondary/60 flex items-center justify-center cursor-pointer select-none transition-all duration-300 shadow-soft hover:shadow-gold ${
                isSelected ? "ring-2 ring-accent" : ""
              }`}
              onPointerEnter={() => prefetch(transformed(image.image_url, 1280, 78))}
              onMouseDown={() => startPress(image.id)}
              onMouseUp={cancelPress}
              onMouseLeave={cancelPress}
              onTouchStart={() => { prefetch(transformed(image.image_url, 1280, 78)); startPress(image.id); }}
              onTouchEnd={cancelPress}
              onTouchMove={cancelPress}
              onClick={() => handleClick(index, image.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                setSelectionMode(true);
                toggleSelect(image.id);
              }}
            >
              {!loadedIds.has(image.id) && (
                <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-secondary via-muted to-secondary" />
              )}
              <img
                src={transformed(image.image_url, 320, 55)}
                alt=""
                loading={index < 8 ? "eager" : "lazy"}
                fetchPriority={index < 4 ? "high" : "auto"}
                decoding="async"
                draggable={false}
                onLoad={() => markLoaded(image.id)}
                onError={() => markLoaded(image.id)}
                className={`block max-w-full max-h-full h-auto w-auto object-contain transition-all duration-500 ${
                  loadedIds.has(image.id)
                    ? "opacity-100 blur-0 scale-100"
                    : "opacity-0 blur-md scale-105"
                } ${isSelected ? "scale-95" : hover}`}
              />

              {selectionMode && (
                <div className="absolute top-2 left-2">
                  {isSelected ? (
                    <CheckCircle2 className="w-6 h-6 text-accent fill-background" />
                  ) : (
                    <Circle className="w-6 h-6 text-primary-foreground drop-shadow" />
                  )}
                </div>
              )}

            </div>
          );
        })}
            </div>
          </section>
        ))}
      </div>

      {/* Lightbox */}
      {current && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center animate-in fade-in duration-200"
          onClick={closeLightbox}
        >
          <button
            className="absolute top-3 left-3 z-40 inline-flex items-center gap-2 rounded-full border border-foreground/30 bg-black/85 px-4 py-2.5 text-foreground shadow-lg shadow-black/60 backdrop-blur-sm hover:bg-black active:scale-95 transition-transform"
            style={{ textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}
            onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 shrink-0" />
            <span className="text-sm font-semibold">Back</span>
          </button>


          {lightboxIndex! > 0 && (
            <button
              className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-background/20 text-primary-foreground hover:bg-background/30"
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              aria-label="Previous"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          {lightboxIndex! < images.length - 1 && (
            <button
              className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-background/20 text-primary-foreground hover:bg-background/30"
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              aria-label="Next"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Viewer: owns horizontal gestures; the track is moved only via translate3d */}
          <div
            ref={viewerRef}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onSwipeStart}
            onTouchMove={onSwipeMove}
            onTouchEnd={onSwipeEnd}
            onTouchCancel={onSwipeEnd}
            className="absolute inset-0 top-0 bottom-[112px] sm:bottom-44 overflow-hidden"
            style={{ touchAction: "pan-y", overscrollBehaviorX: "none" }}
          >
            {/* Solid dark fill so unused side space stays uniformly black and never flickers while swiping. */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden sm:hidden bg-black" aria-hidden />
            <div
              ref={trackRef}
              className="relative flex h-full w-full gap-0"
              style={{ willChange: "transform", transform: "translate3d(0,0,0)" }}
            >
              {images.map((img, i) => {
                const near = Math.abs(i - (lightboxIndex ?? 0)) <= 2;
                return (
                  <div
                    key={img.id}
                    className="relative h-full w-full min-w-full max-w-full basis-full shrink-0 grow-0 flex items-center justify-center overflow-hidden px-0 py-2 sm:p-6"
                  >
                    {near && (
                      <>
                        {/* Cached grid thumbnail shows instantly (no filters — cheap to composite) while the full photo streams in */}
                        <img
                          src={transformed(img.image_url, 320, 55)}
                          alt=""
                          aria-hidden
                          draggable={false}
                          className={`absolute inset-0 m-auto block h-full w-full object-contain select-none transition-opacity duration-200 ${
                            fullLoadedIds.has(img.id) ? "opacity-0" : "opacity-100"
                          }`}
                        />
                        <img
                          src={transformed(img.image_url, 1280, 78)}
                          alt=""
                          draggable={false}
                          decoding="async"
                          loading={i === lightboxIndex ? "eager" : "lazy"}
                          fetchPriority={i === lightboxIndex ? "high" : "auto"}
                          onLoad={() => markFullLoaded(img.id)}
                          onError={() => markFullLoaded(img.id)}
                          className={`absolute inset-0 m-auto block h-full w-full object-contain select-none transition-opacity duration-200 ${
                            fullLoadedIds.has(img.id) ? "opacity-100" : "opacity-0"
                          }`}
                        />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Thumbnail filmstrip (desktop only — mobile uses full-width swipe) */}
          <div
            className="hidden sm:flex absolute bottom-24 left-0 right-0 z-10 gap-2 overflow-x-auto px-4 py-2 no-scrollbar"
            style={{ scrollbarWidth: "none" }}
            onClick={(e) => e.stopPropagation()}
          >
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setLightboxIndex(i)}
                aria-label={`Photo ${i + 1}`}
                className={`shrink-0 h-12 w-12 sm:h-14 sm:w-14 rounded-md overflow-hidden border-2 transition-all ${
                  i === lightboxIndex ? "border-accent scale-105" : "border-transparent opacity-60"
                }`}
              >
                <img src={transformed(img.image_url, 64, 50)} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>


          {/* Swipe hint on touch */}
          <p className="sm:hidden absolute top-6 right-4 z-10 text-[11px] text-primary-foreground/70">
            Swipe to browse
          </p>



          <div
            className="absolute bottom-0 left-0 right-0 sm:bottom-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 flex flex-col items-center gap-3 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-3 bg-card/95 sm:bg-card/90 backdrop-blur border-t sm:border border-border/60 sm:rounded-xl shadow-soft"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((v) => {
                const shown =
                  hoverStar?.id === current.id ? hoverStar.val : currentRating?.mine || 0;
                const filled = v <= shown;
                return (
                  <button
                    key={v}
                    aria-label={`Rate ${v}`}
                    onMouseEnter={() => setHoverStar({ id: current.id, val: v })}
                    onMouseLeave={() => setHoverStar(null)}
                    onClick={() => submitRating(current.id, v)}
                    className="p-1.5 active:scale-125 transition-transform"
                  >
                    <Star className={`w-6 h-6 sm:w-5 sm:h-5 ${filled ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                  </button>
                );
              })}
              <span className="ml-2 text-xs text-muted-foreground">
                {currentRating && currentRating.count > 0
                  ? `${currentRating.avg.toFixed(1)} avg · ${currentRating.count} rating${currentRating.count > 1 ? "s" : ""}`
                  : "Be the first to rate"}
              </span>
            </div>

            <div className="flex w-full items-center gap-3">
              <span className="text-sm text-foreground font-medium px-1 whitespace-nowrap">
                {lightboxIndex! + 1} / {images.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none"
                onClick={() => openShareDialog(current.image_url, eventName)}
              >
                <Share2 className="w-4 h-4 mr-2" /> Share
              </Button>
              <Button
                variant="gold"
                size="sm"
                className="flex-1 sm:flex-none"
                onClick={() => downloadOne(current.image_url, `${eventName}-${current.id}.jpg`)}
              >
                <Download className="w-4 h-4 mr-2" /> Download
              </Button>
            </div>
          </div>
        </div>
      )}


      {shareTarget && (
        <ShareSheet target={shareTarget} onClose={() => setShareTarget(null)} />
      )}
    </>
  );
}

function ShareSheet({ target, onClose }: { target: ShareTarget; onClose: () => void }) {
  const encodedUrl = encodeURIComponent(target.url);
  const encodedTitle = encodeURIComponent(target.title);
  const message = `${target.title} — download here: ${target.url}`;
  const encodedMsg = encodeURIComponent(message);

  const platforms: { label: string; href: string; bg: string; icon: React.ReactNode }[] = [
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodedMsg}`,
      bg: "bg-[#25D366] text-white",
      icon: <WhatsAppIcon />,
    },
    {
      label: "Telegram",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      bg: "bg-[#229ED9] text-white",
      icon: <TelegramIcon />,
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      bg: "bg-[#1877F2] text-white",
      icon: <FacebookIcon />,
    },
    {
      label: "X / Twitter",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      bg: "bg-foreground text-background",
      icon: <XIcon />,
    },
    {
      label: "Email",
      href: `mailto:?subject=${encodedTitle}&body=${encodedMsg}`,
      bg: "bg-secondary text-foreground",
      icon: <Mail className="w-5 h-5" />,
    },
  ];

  const tryNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: target.title, url: target.url, text: message });
        onClose();
      } catch (e: any) {
        if (e?.name !== "AbortError") toast({ title: "Share failed", variant: "destructive" });
      }
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(target.url);
      toast({ title: "Link copied", description: "Paste it anywhere to share." });
      onClose();
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-foreground/80 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-card border border-border/60 rounded-t-2xl sm:rounded-2xl p-5 shadow-gold animate-in slide-in-from-bottom-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold text-foreground">Share photo</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-secondary" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-5">
          {platforms.map((p) => (
            <a
              key={p.label}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setTimeout(onClose, 150)}
              className="flex flex-col items-center gap-1.5 group"
            >
              <span className={`w-12 h-12 rounded-full flex items-center justify-center ${p.bg} transition-transform group-hover:scale-110 shadow-soft`}>
                {p.icon}
              </span>
              <span className="text-[11px] text-muted-foreground text-center">{p.label}</span>
            </a>
          ))}
          <button onClick={copyLink} className="flex flex-col items-center gap-1.5 group">
            <span className="w-12 h-12 rounded-full flex items-center justify-center bg-accent text-accent-foreground transition-transform group-hover:scale-110 shadow-soft">
              <Copy className="w-5 h-5" />
            </span>
            <span className="text-[11px] text-muted-foreground">Copy link</span>
          </button>
        </div>

        <div className="rounded-lg border border-border/60 bg-background/60 p-2 text-xs text-muted-foreground break-all mb-3">
          {target.url}
        </div>

        <div className="flex gap-2">
          {typeof navigator !== "undefined" && "share" in navigator && (
            <Button variant="outline" className="flex-1" onClick={tryNative}>
              <Share2 className="w-4 h-4 mr-2" /> More…
            </Button>
          )}
          <Button variant="gold" className="flex-1" onClick={copyLink}>
            <Copy className="w-4 h-4 mr-2" /> Copy link
          </Button>
        </div>
      </div>
    </div>
  );
}

/* Inline brand icons kept minimal to avoid extra deps */
function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden>
      <path d="M20.5 3.5A11.9 11.9 0 0 0 12 0C5.4 0 .1 5.3.1 11.9c0 2.1.5 4.1 1.6 5.9L0 24l6.4-1.7a11.9 11.9 0 0 0 5.6 1.4h.1c6.5 0 11.9-5.3 11.9-11.9 0-3.2-1.2-6.2-3.5-8.3zM12 21.4h-.1a9.5 9.5 0 0 1-4.9-1.3l-.4-.2-3.8 1 1-3.7-.2-.4a9.4 9.4 0 0 1-1.5-5.1c0-5.2 4.3-9.4 9.5-9.4 2.5 0 4.9 1 6.7 2.8a9.4 9.4 0 0 1 2.8 6.7c0 5.2-4.3 9.6-9.5 9.6zm5.4-7c-.3-.1-1.8-.9-2-1s-.5-.1-.7.2-.8 1-1 1.2-.4.2-.7 0c-.3-.1-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.6.3-.5c.1-.2 0-.3 0-.5s-.7-1.7-1-2.3c-.2-.6-.5-.5-.7-.5H7c-.2 0-.5.1-.8.4s-1 1-1 2.4 1 2.8 1.1 3c.1.2 2 3 4.8 4.2.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.4.3-.7.3-1.2.2-1.4-.1-.2-.3-.3-.6-.4z"/>
    </svg>
  );
}
function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden>
      <path d="M9.8 15.5 9.6 19c.4 0 .6-.2.9-.4l2.1-2 4.4 3.2c.8.4 1.4.2 1.6-.8l2.9-13.7c.3-1.2-.4-1.7-1.2-1.4L2.4 9.4c-1.2.5-1.2 1.1-.2 1.4l4.6 1.4 10.7-6.7c.5-.3 1-.1.6.2z"/>
    </svg>
  );
}
function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden>
      <path d="M13.5 22v-8h2.7l.4-3.1h-3.1V8.9c0-.9.3-1.5 1.6-1.5h1.6V4.6c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.4H7.9V14h2.7v8h2.9z"/>
    </svg>
  );
}
function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden>
      <path d="M17.5 3h3.2l-7 8 8.2 10h-6.4l-5-6.4L4.7 21H1.5l7.5-8.6L1 3h6.5l4.5 6zm-1.1 16.1h1.8L7.7 4.8H5.8z"/>
    </svg>
  );
}
