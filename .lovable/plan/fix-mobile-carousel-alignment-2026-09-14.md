# Fix mobile carousel alignment

## Goal
Keep every lightbox image centered at the same mobile position without progressive horizontal drift, while preserving the existing viewer design and gestures.

## Changes
- Update the lightbox track to align from the active slide’s measured position instead of multiplying the index by an assumed viewport width.
- Make each slide explicitly occupy one full viewer width with no shrinking, unintended gaps, or overflow-producing viewport units.
- Re-align on viewer size changes so rotation and responsive resizing remain exact.
- Preserve `object-contain`, the blurred side fill, navigation controls, loading behavior, and desktop presentation.

## Verification
- Check slide and image bounding boxes through at least 10 images at 320, 360, 375, 390, and 430px widths.
- Confirm swipe navigation, button navigation, centering, clipping, and horizontal page overflow.

## Technical details
Use each active slide’s actual `offsetLeft` as the transform origin (`translate3d(-offsetLeft + dragOffset, 0, 0)`), plus explicit `basis-full/min-w-full/max-w-full` slide sizing and a `ResizeObserver` on the viewer.
