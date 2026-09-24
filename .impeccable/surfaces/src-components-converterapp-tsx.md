---
version: 1
slug: "src-components-converterapp-tsx"
primary_target: "src/components/ConverterApp.tsx"
related_targets: []
---

# Surface: converter workspace (src/components/ConverterApp.tsx)

Scope: the single-screen app — input instrument panel beside the Excalidraw canvas. Visitor mode: Operate.
Audience/job: developers and technical writers turning a description, a data file or an image into an editable diagram; hosted-demo visitors evaluating the tool.
Constraints: Excalidraw's own editor UI is untouched; conversion only works locally with Claude Code (hosted demo returns 500), so the panel must be honest about that and still give visitors something real (sample diagram).
Memorable moment: the orange commit key and the amber status window reporting the conversion in words and a running clock.

## Direction contract

THESIS: The input panel is a desk instrument that plots onto paper. It refuses the category default of a pale settings sidebar with purple pill tabs and a gray full-width button.

OWN-WORLD: Keycap hardware. Two chassis colorways: bone/putty keycaps on a gunmetal chassis (dark) and putty chassis with charcoal legends (light). Keys are grid units with layered shadows and real key travel; mode keys light an amber LED; exactly one safety-orange key commits. An amber LCD window reports state as words (IDLE, ARMED, WORKING, PLOTTED, FAULT) with tabular numerals. Legends in a wide mono; prose in a quiet grotesk.

STORY: Visitor sees the instrument, picks a mode key, feeds input, presses the orange key, watches the window count, and the diagram lands on the canvas. On the hosted demo they learn in one line that conversion runs locally, and can load a sample diagram.

FIRST VIEWPORT: Desktop: 360px chassis left (resizable), canvas right. Top: wordmark + theme key. Then LCD window full width, then 3 mode keys in a row, then the input bay, example cells, and the orange CONVERT key pinned to the bottom. Mobile: chassis full width with a two-key Panel/Canvas switch; conversion jumps to Canvas.

FORM: creator-hardware desk instrument (dealt challenger 1, won both axes over assigned candidate 7 "risograph dev zine"); seed key d0e76524. Raises kept from declined challengers: doujin catalog -> examples as a strict coded cell grid; seven-segment -> ghost/idle state designed; cyclorama -> states named in words, never color alone; orizuru -> none.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
