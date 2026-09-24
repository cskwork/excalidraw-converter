# Asset register

Raster assets shipped by the app, with their origin. Every asset below was generated on 2026-09-24 with GPT Image 2 (ChatGPT Images 2.0) through the local Codex CLI, then resized and compressed with ImageMagick. Each file also carries its exact prompt (embedded as JPEG/PNG metadata, or in a `.json` sidecar for WebP).

| File | Used for | Size | Alt text | Processing |
|------|----------|------|----------|------------|
| `public/art/empty-canvas.webp` | Illustration in the empty canvas state | 960x640 | "Sketch of a handwritten note turning into a flowchart of boxes and arrows" | 1536x1024 PNG, white background flood-filled to transparent, WebP q85 |
| `src/app/opengraph-image.jpg` | Open Graph preview | 1200x630 | See `opengraph-image.alt.txt` | 1672x941 PNG, scaled and center-cropped, JPEG q84 |
| `src/app/twitter-image.jpg` | Twitter/X card preview | 1200x630 | See `twitter-image.alt.txt` | Copy of the Open Graph image |
| `src/app/icon.png` | Favicon / app icon | 512x512 | n/a (icon) | 1254x1254 PNG, scaled |
| `src/app/apple-icon.png` | Apple touch icon | 180x180 | n/a (icon) | 1254x1254 PNG, scaled |

## Prompts

**empty-canvas.webp**

> Hand-drawn diagram illustration in the loose, sketchy marker style of the Excalidraw whiteboard app, on a pure white background, landscape 3:2. On the left, a short handwritten-looking note with four scribbled text lines (no legible words) on a torn index card. A thick hand-drawn arrow sweeps right into a tidy flowchart: three rounded rectangles connected by hand-drawn arrows and one diamond decision shape, lightly filled with pale blue, pale green and pale yellow hachure fill, charcoal strokes. Small safety-orange accent dot on the arrow. Plenty of white space, no words, no letters, no logos, no shadows, flat.

**opengraph-image.jpg / twitter-image.jpg**

> Wide 16:9 product key art. Left half: a compact creator-hardware desk instrument seen from a slightly high three-quarter angle: gunmetal anodized aluminum chassis, a row of three bone-colored PBT keycaps with small dark mono legends reading TEXT, FILE, IMAGE, one larger safety-orange keycap reading CONVERT, and a small amber backlit LCD window showing the word PLOTTED and 00:12 in dot-matrix digits. Right half: a sheet of white paper on the dark desk with a hand-drawn, sketchy Excalidraw-style flowchart of rounded boxes and arrows in charcoal with pale blue and pale green fills. Across the top left in clean bone-white wide monospace capitals: EXCALIDRAW CONVERTER, and below it smaller: Turn anything into editable diagrams. Dark charcoal studio background, soft top light, photographic, crisp, no other text, no logos.

**icon.png / apple-icon.png**

> App icon, square, centered: a single safety-orange (#FF6A00) mechanical keyboard keycap seen from a slight top angle on a dark gunmetal square background with softly rounded corners. On the keycap top, a small hand-drawn charcoal legend: a tiny rectangle with an arrow pointing to a diamond, drawn in loose sketchy whiteboard-marker style. Soft studio light, subtle shadow, minimal, no text, no letters.
