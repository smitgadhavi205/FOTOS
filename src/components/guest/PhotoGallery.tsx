import { useState } from "react";
import { Download, X, ChevronLeft, ChevronRight, Grid3X3, LayoutGrid, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Photo {
  id: string;
  url: string;
  thumbnail: string;
}

interface PhotoGalleryProps {
  photos: Photo[];
  eventName: string;
}

export function PhotoGallery({ photos, eventName }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [gridSize, setGridSize] = useState<"small" | "large">("large");

  const currentIndex = selectedPhoto
    ? photos.findIndex((p) => p.id === selectedPhoto.id)
    : -1;

  const goToNext = () => {
    if (currentIndex < photos.length - 1) {
      setSelectedPhoto(photos[currentIndex + 1]);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setSelectedPhoto(photos[currentIndex - 1]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") goToNext();
    if (e.key === "ArrowLeft") goToPrev();
    if (e.key === "Escape") setSelectedPhoto(null);
  };

  const downloadPhoto = async (photo: Photo) => {
    try {
      const response = await fetch(photo.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${eventName}-photo-${photo.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Your Photos from {eventName}
          </h1>
          <p className="text-muted-foreground">
            We found {photos.length} photo{photos.length !== 1 ? "s" : ""} featuring you
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">View:</span>
            <div className="flex rounded-lg bg-secondary p-1">
              <button
                onClick={() => setGridSize("large")}
                className={`p-2 rounded-md transition-all ${
                  gridSize === "large"
                    ? "bg-card shadow-soft text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setGridSize("small")}
                className={`p-2 rounded-md transition-all ${
                  gridSize === "small"
                    ? "bg-card shadow-soft text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download All
          </Button>
        </div>

        {/* Photo Grid */}
        {photos.length === 0 ? (
          <Card variant="elevated" className="p-12 text-center">
            <p className="text-muted-foreground">
              No photos found. Try uploading a different selfie.
            </p>
          </Card>
        ) : (
          <div
            className={`grid gap-4 ${
              gridSize === "large"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            }`}
          >
            {photos.map((photo, index) => (
              <Card
                key={photo.id}
                variant="photo"
                className="cursor-pointer animate-fade-up"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => setSelectedPhoto(photo)}
              >
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={photo.thumbnail}
                    alt={`Event photo ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                      <span className="text-primary-foreground text-sm font-medium">
                        View
                      </span>
                      <ZoomIn className="w-5 h-5 text-primary-foreground" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-foreground/95 flex items-center justify-center"
          onClick={() => setSelectedPhoto(null)}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-background/20 text-primary-foreground hover:bg-background/30 transition-colors"
            onClick={() => setSelectedPhoto(null)}
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navigation */}
          {currentIndex > 0 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/20 text-primary-foreground hover:bg-background/30 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                goToPrev();
              }}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          {currentIndex < photos.length - 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/20 text-primary-foreground hover:bg-background/30 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Image */}
          <img
            src={selectedPhoto.url}
            alt="Full size photo"
            className="max-h-[85vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Bottom bar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 p-3 rounded-xl glass border border-border/50">
            <span className="text-sm text-foreground font-medium">
              {currentIndex + 1} / {photos.length}
            </span>
            <Button
              variant="gold"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                downloadPhoto(selectedPhoto);
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
