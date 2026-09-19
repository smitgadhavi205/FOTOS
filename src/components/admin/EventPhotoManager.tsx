import { useEffect, useState, useCallback, useRef } from "react";
import { Eye, EyeOff, Loader2, Image as ImageIcon, Trash2, Star, X, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { PHOTO_CATEGORIES, UNCATEGORIZED, categoryLabel } from "@/lib/photoCategories";

interface EventPhoto {
  id: string;
  image_url: string;
  is_visible: boolean;
  created_at: string;
  category: string | null;
}

type Filter = "all" | "visible" | "hidden";

interface Props {
  eventId: string;
  refreshKey?: number;
  coverImageUrl?: string | null;
  onCoverChange?: (url: string) => void;
}

export function EventPhotoManager({ eventId, refreshKey = 0, coverImageUrl = null, onCoverChange }: Props) {
  const [photos, setPhotos] = useState<EventPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyIds, setBusyIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [cover, setCover] = useState<string | null>(coverImageUrl);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const pressTimer = useRef<number | null>(null);
  const longPressed = useRef(false);

  useEffect(() => setCover(coverImageUrl), [coverImageUrl]);

  const fetchPhotos = useCallback(async () => {
    const { data, error } = await supabase
      .from("event_images")
      .select("id, image_url, is_visible, created_at, category")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading photos:", error);
    } else {
      setPhotos((data as EventPhoto[]) || []);
    }
    setIsLoading(false);
  }, [eventId]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos, refreshKey]);

  // Exit selection mode when nothing is selected
  useEffect(() => {
    if (selectionMode && selected.length === 0) setSelectionMode(false);
  }, [selected, selectionMode]);

  const setVisibility = async (ids: string[], visible: boolean) => {
    setBusyIds((prev) => [...prev, ...ids]);
    const { error } = await supabase
      .from("event_images")
      .update({ is_visible: visible })
      .in("id", ids);
    setBusyIds((prev) => prev.filter((id) => !ids.includes(id)));

    if (error) {
      toast({ title: "Could not update", description: error.message, variant: "destructive" });
      return;
    }
    setPhotos((prev) => prev.map((p) => (ids.includes(p.id) ? { ...p, is_visible: visible } : p)));
    toast({
      title: visible ? "Photos are now visible" : "Photos hidden",
      description: `${ids.length} photo${ids.length !== 1 ? "s" : ""} updated.`,
    });
  };

  const deleteSelected = async () => {
    const ids = [...selected];
    setIsDeleting(true);
    const { error } = await supabase.from("event_images").delete().in("id", ids);
    setIsDeleting(false);
    setConfirmDelete(false);

    if (error) {
      toast({ title: "Could not delete", description: error.message, variant: "destructive" });
      return;
    }
    setPhotos((prev) => prev.filter((p) => !ids.includes(p.id)));
    setSelected([]);
    setSelectionMode(false);
    toast({ title: "Photos deleted", description: `${ids.length} photo${ids.length !== 1 ? "s" : ""} removed.` });
  };

  const setAsThumbnail = async (url: string) => {
    const { error } = await supabase.from("events").update({ cover_image_url: url }).eq("id", eventId);
    if (error) {
      toast({ title: "Could not set thumbnail", description: error.message, variant: "destructive" });
      return;
    }
    setCover(url);
    onCoverChange?.(url);
    setSelected([]);
    setSelectionMode(false);
    toast({ title: "Event thumbnail updated" });
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const startPress = (id: string) => {
    longPressed.current = false;
    pressTimer.current = window.setTimeout(() => {
      longPressed.current = true;
      if (navigator.vibrate) navigator.vibrate(15);
      setSelectionMode(true);
      setSelected((prev) => (prev.includes(id) ? prev : [...prev, id]));
    }, 450);
  };
  const cancelPress = () => {
    if (pressTimer.current) window.clearTimeout(pressTimer.current);
    pressTimer.current = null;
  };

  const setCategory = async (ids: string[], category: string | null) => {
    setBusyIds((prev) => [...prev, ...ids]);
    const { error } = await supabase.from("event_images").update({ category }).in("id", ids);
    setBusyIds((prev) => prev.filter((id) => !ids.includes(id)));

    if (error) {
      toast({ title: "Could not update category", description: error.message, variant: "destructive" });
      return;
    }
    setPhotos((prev) => prev.map((p) => (ids.includes(p.id) ? { ...p, category } : p)));
    toast({
      title: "Category updated",
      description: `${ids.length} photo${ids.length !== 1 ? "s" : ""} set to ${categoryLabel(category)}.`,
    });
  };

  const visibleCount = photos.filter((p) => p.is_visible).length;
  const hiddenCount = photos.length - visibleCount;
  const shown = photos.filter((p) => {
    const byStatus = filter === "all" ? true : filter === "visible" ? p.is_visible : !p.is_visible;
    const byCategory =
      categoryFilter === "all" ? true : categoryLabel(p.category) === categoryFilter;
    return byStatus && byCategory;
  });
  const selectedPhotos = photos.filter((p) => selected.includes(p.id));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Photo Library</CardTitle>
        <CardDescription>
          Newest uploads appear first. Control who can see each photo, tag photos with a category
          (Reception, Dance, Bride &amp; Groom…), and long-press (or right-click) to select multiple
          and hide, delete, categorise, or set an event thumbnail.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {(["all", "visible", "hidden"] as Filter[]).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "gold" : "ghost"}
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f} ({f === "all" ? photos.length : f === "visible" ? visibleCount : hiddenCount})
            </Button>
          ))}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-9 w-[170px]">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {PHOTO_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
              <SelectItem value={UNCATEGORIZED}>{UNCATEGORIZED}</SelectItem>
            </SelectContent>
          </Select>
          <div className="ml-auto flex gap-2">
            {selectionMode ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  setSelected(selected.length === shown.length ? [] : shown.map((p) => p.id))
                }
              >
                <CheckSquare className="w-4 h-4 mr-2" />
                {selected.length === shown.length ? "Clear" : "Select all"}
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={photos.length === 0 || hiddenCount === 0}
                  onClick={() => setVisibility(photos.filter((p) => !p.is_visible).map((p) => p.id), true)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Show all
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={photos.length === 0 || visibleCount === 0}
                  onClick={() => setVisibility(photos.filter((p) => p.is_visible).map((p) => p.id), false)}
                >
                  <EyeOff className="w-4 h-4 mr-2" />
                  Hide all
                </Button>
              </>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <ImageIcon className="w-10 h-10 mb-3 opacity-50" />
            <p>{photos.length === 0 ? "No photos uploaded yet" : "No photos in this filter"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[520px] overflow-y-auto pb-24 sm:pb-3">
            {shown.map((photo) => {
              const busy = busyIds.includes(photo.id);
              const isSelected = selected.includes(photo.id);
              const isCover = cover === photo.image_url;
              return (
                <div
                  key={photo.id}
                  className={`relative rounded-lg overflow-hidden border transition-all select-none ${
                    isSelected ? "border-accent ring-2 ring-accent/50" : "border-border"
                  }`}
                  onTouchStart={() => startPress(photo.id)}
                  onTouchEnd={cancelPress}
                  onTouchMove={cancelPress}
                  onMouseDown={() => startPress(photo.id)}
                  onMouseUp={cancelPress}
                  onMouseLeave={cancelPress}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setSelectionMode(true);
                    setSelected((prev) => (prev.includes(photo.id) ? prev : [...prev, photo.id]));
                  }}
                  onClick={() => {
                    if (longPressed.current) {
                      longPressed.current = false;
                      return;
                    }
                    if (selectionMode) toggleSelect(photo.id);
                  }}
                >
                  <div className="relative aspect-square bg-muted">
                    <img
                      src={photo.image_url}
                      alt="Event photo"
                      loading="lazy"
                      draggable={false}
                      className={`w-full h-full object-cover transition-all ${
                        photo.is_visible ? "" : "grayscale opacity-50"
                      } ${isSelected ? "scale-95" : ""}`}
                    />
                    {selectionMode && (
                      <div className="absolute top-2 right-2 rounded-md bg-background/90 p-1">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(photo.id)}
                          aria-label="Select photo"
                        />
                      </div>
                    )}
                    {isCover && (
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-accent text-accent-foreground text-[10px] font-medium">
                        <Star className="w-3 h-3 fill-current" />
                        Thumbnail
                      </div>
                    )}
                    {!photo.is_visible && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-background/85 text-xs">
                        <EyeOff className="w-3 h-3" />
                        Hidden
                      </div>
                    )}
                    {busy && (
                      <div className="absolute inset-0 grid place-items-center bg-background/50">
                        <Loader2 className="w-5 h-5 animate-spin text-accent" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">
                        {photo.is_visible ? "Visible" : "Hidden"}
                      </span>
                      <Switch
                        checked={photo.is_visible}
                        disabled={busy || selectionMode}
                        onCheckedChange={(v) => setVisibility([photo.id], v)}
                        aria-label="Toggle photo visibility"
                      />
                    </div>
                    <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                      <Select
                        value={categoryLabel(photo.category)}
                        disabled={busy || selectionMode}
                        onValueChange={(v) =>
                          setCategory([photo.id], v === UNCATEGORIZED ? null : v)
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UNCATEGORIZED}>{UNCATEGORIZED}</SelectItem>
                          {PHOTO_CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Selection action bar */}
      {selectionMode && selected.length > 0 && (
        <div
          className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur-md px-4 py-3 animate-in slide-in-from-bottom"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <div className="container mx-auto flex flex-wrap items-center gap-2">
            <Button size="icon" variant="ghost" onClick={() => { setSelected([]); setSelectionMode(false); }}>
              <X className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium">{selected.length} selected</span>
            <div className="ml-auto flex flex-wrap gap-2">
              <Button size="sm" variant="ghost" onClick={() => setVisibility(selected, true)}>
                <Eye className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Show</span>
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setVisibility(selected, false)}>
                <EyeOff className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Hide</span>
              </Button>
              <Select
                onValueChange={(v) => setCategory(selected, v === UNCATEGORIZED ? null : v)}
              >
                <SelectTrigger className="h-9 w-[150px]">
                  <SelectValue placeholder="Set category" />
                </SelectTrigger>
                <SelectContent>
                  {PHOTO_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                  <SelectItem value={UNCATEGORIZED}>{UNCATEGORIZED}</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="gold"
                disabled={selected.length !== 1}
                onClick={() => selectedPhotos[0] && setAsThumbnail(selectedPhotos[0].image_url)}
              >
                <Star className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Set thumbnail</span>
              </Button>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.length} photo{selected.length !== 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the selected photos from this event. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); deleteSelected(); }} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
