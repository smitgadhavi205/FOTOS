export const PHOTO_CATEGORIES = [
  "Reception",
  "Dance",
  "Bride & Groom",
  "Ceremony",
  "Family",
  "Candid",
  "Cake & Decor",
] as const;

export type PhotoCategory = (typeof PHOTO_CATEGORIES)[number];

export const UNCATEGORIZED = "Uncategorized";

export function categoryLabel(category?: string | null) {
  return category && category.trim() ? category : UNCATEGORIZED;
}
