import { ChevronRight, Images } from "lucide-react";

export interface AlbumEntry {
  name: string;
  count: number;
  cover?: string | null;
}

interface CategoryAlbumsProps {
  albums: AlbumEntry[];
  onOpen: (name: string) => void;
}

/** Serve a small resized cover instead of the multi-MB original. */
function cover(url: string) {
  if (!url.includes("/storage/v1/object/public/")) return url;
  return (
    url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/") +
    "?width=480&quality=65&resize=cover"
  );
}

export function CategoryAlbums({ albums, onOpen }: CategoryAlbumsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {albums.map((album) => (
        <button
          key={album.name}
          type="button"
          onClick={() => onOpen(album.name)}
          className="group text-left active:scale-[0.98] transition-transform"
        >
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-secondary/60 shadow-soft group-hover:shadow-gold transition-shadow">
            {album.cover ? (
              <img
                src={cover(album.cover)}
                alt={`${album.name} album cover`}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <Images className="h-8 w-8 opacity-60" />
              </div>
            )}
            <span className="absolute bottom-2 right-2 rounded-full bg-background/80 px-2 py-0.5 text-[11px] font-medium text-foreground backdrop-blur">
              {album.count}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 px-0.5">
            <span className="truncate text-sm font-medium text-foreground">{album.name}</span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </div>
        </button>
      ))}
    </div>
  );
}
