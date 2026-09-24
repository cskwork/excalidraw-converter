---
name: Excalidraw Converter
description: A keycap desk instrument that plots editable diagrams onto the Excalidraw canvas.
colors:
  safety-orange: "#ff6a00"
  safety-orange-press: "#e85f00"
  on-orange: "#1a0e05"
  lcd-amber: "#f4a93a"
  lcd-amber-deep: "#e29426"
  lcd-ink: "#2a1804"
  putty-chassis: "#d3cec4"
  putty-chassis-edge: "#bfb9ad"
  gunmetal-chassis: "#2d3135"
  gunmetal-chassis-edge: "#1d2023"
  bone-key-light: "#f1eee7"
  bone-key-dark: "#d8d3c6"
  key-skirt-light: "#bcb5a7"
  key-skirt-dark: "#9f998b"
  legend-charcoal: "#1e2124"
  ink-dim-light: "#4d4943"
  ink-dim-dark: "#aaa69d"
  ink-dark: "#e8e4db"
  well-light: "#f8f7f3"
  well-dark: "#17191c"
  bezel: "#2b2e31"
  fault-ink-light: "#8a1f0f"
  fault-bg-light: "#fbe9e4"
typography:
  wordmark:
    fontFamily: "Martian Mono, ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 600
    letterSpacing: "0.06em"
  legend:
    fontFamily: "Martian Mono, ui-monospace, monospace"
    fontSize: "11px"
    fontWeight: 500
    letterSpacing: "0.06em"
  lcd-readout:
    fontFamily: "Martian Mono, ui-monospace, monospace"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "0.06em"
  body:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 500
    lineHeight: 1.3
rounded:
  well: "6px"
  key: "7px"
  commit-key: "9px"
  bezel: "10px"
spacing:
  xs: "6px"
  sm: "8px"
  md: "16px"
  lg: "20px"
components:
  button-commit:
    backgroundColor: "{colors.safety-orange}"
    textColor: "{colors.on-orange}"
    typography: "{typography.legend}"
    rounded: "{rounded.commit-key}"
    padding: "0 16px"
    height: "54px"
  button-commit-active:
    backgroundColor: "{colors.safety-orange-press}"
  button-key:
    backgroundColor: "{colors.bone-key-light}"
    textColor: "{colors.legend-charcoal}"
    typography: "{typography.legend}"
    rounded: "{rounded.key}"
    padding: "0 12px"
    height: "40px"
  input-well:
    backgroundColor: "{colors.well-light}"
    textColor: "{colors.legend-charcoal}"
    typography: "{typography.body}"
    rounded: "{rounded.well}"
    padding: "10px 12px"
  status-window:
    backgroundColor: "{colors.lcd-amber}"
    textColor: "{colors.lcd-ink}"
    typography: "{typography.lcd-readout}"
    rounded: "{rounded.bezel}"
---

# Design System: Excalidraw Converter

## Overview

**Creative North Star: "The desk instrument that plots onto paper"**

The input panel is a small hardware instrument parked beside the Excalidraw canvas. Mode keys pick what you feed it, an amber status window reports what it is doing in plain words, and one safety-orange key commits. The canvas stays Excalidraw's own paper: the instrument never draws on it, it only places a diagram there.

The instrument ships in two colorways that follow the app theme: a putty chassis with bone keys (light) and a gunmetal chassis with bone keys (dark). Keys, status window and orange key look the same in both, the way a physical device keeps its keycaps when the case color changes.

**Key Characteristics:**
- Real controls rendered as keycaps: flat tops, a shaded skirt, 2-3px of travel on press.
- Exactly one orange element on screen, and it is the action that commits.
- State is always named in words (IDLE, READY, WORKING, PLOTTED, FAULT), never by color alone.
- Wide mono legends for labels and readouts; a quiet grotesk for anything a person reads as prose.

## Colors

### Primary
- **Safety Orange** (#ff6a00): only the Convert key. Pressed state Safety Orange Press (#e85f00). Legends on it are near-black On Orange (#1a0e05); white text on this orange fails contrast.

### Secondary
- **LCD Amber** (#f4a93a to #e29426 gradient) with **LCD Ink** (#2a1804): the status window only. Unlit cells use LCD Ink at 13% opacity.
- **Amber LED** (#ffb020): the lit indicator on the selected mode key and view key.

### Neutral
- **Putty Chassis** (#d3cec4) / **Gunmetal Chassis** (#2d3135): the panel body per theme; chassis edges #bfb9ad / #1d2023.
- **Bone Key** (#f1eee7 light, #d8d3c6 dark) with skirts #bcb5a7 / #9f998b and **Legend Charcoal** (#1e2124) in both themes.
- **Wells** (#f8f7f3 light, #17191c dark): recessed text field and drop bays.
- **Ink** (#1e2124 light, #e8e4db dark) and **Ink Dim** (#4d4943 light, #aaa69d dark): chassis text; both pass 4.5:1 on their chassis.
- **Fault** (#8a1f0f on #fbe9e4 light, #ffd1c6 on #3a1f1a dark): error card only.

### Named Rules
**The One Orange Key Rule.** Safety Orange appears on one control, the commit key. When Convert is disabled it turns into an ordinary key; orange never marks something you cannot press.

**The Words Not Lights Rule.** Every state the LED or window shows is also written out, so color is never the only signal.

## Typography

**Legend Font:** Martian Mono (with ui-monospace fallback), for keycap legends, section labels, the wordmark, meters and the status readout: things that are labels or measurements.
**Body Font:** Hanken Grotesk (with system sans fallback), for the text field, hints, the status detail line, messages and example titles.

### Hierarchy
- **Wordmark** (600, 13px, 0.06em tracking, uppercase): product name on the chassis plate.
- **Readout** (600, 20px, tabular numerals): state word and clock in the status window.
- **Legend** (500, 10.5-11px, 0.06-0.08em, uppercase): keys and field labels.
- **Body** (400, 14px, 1.5): text field content.
- **Caption** (500, 12.5px, 1.3): status detail, hints, messages.

### Named Rules
**The Legends Are Measurements Rule.** Mono is used for labels, codes and numbers only. Sentences are always set in Hanken Grotesk.

## Layout

Desktop: a resizable panel (280-600px, default 360px) on the left, a 6px resize rail, the canvas filling the rest. Panel order is fixed: plate (wordmark + theme key), status window, mode keys, a groove, the scrolling input bay (field or drop bay, then example cells and the sample key), the fault card when present, then the commit key and a one-line note pinned to the bottom.

Mobile (below 768px): a two-key Panel / Canvas switch on top; only one view shows at a time. Anything that places a diagram (conversion, sample) switches to Canvas.

Spacing: 16px panel gutters, 8px between keys, 6px between example cells, 20px between input sections.

## Elevation & Depth

Depth describes physical travel, not decoration. Keys sit up with an inner skirt shadow and a short soft drop shadow; pressing moves them down 2-3px and shortens both. Wells are recessed with inset shadows. The status window sits in a dark bezel with an inner glow. The chassis carries a 6%-opacity grain.

### Shadow Vocabulary
- **Key rest:** `inset 0 -3px 0 skirt, inset 0 1px 0 rgba(255,255,255,.6), 0 1px 1px rgba(0,0,0,.25), 0 4px 8px -3px rgba(0,0,0,.35)`.
- **Key pressed / selected:** `inset 0 -1px 0 skirt, 0 1px 2px -1px rgba(0,0,0,.3)` plus `translateY(2px)`.
- **Well:** `inset 0 1px 2px rgba(40,34,26,.22), inset 0 0 0 1px rgba(40,34,26,.14)` (light), deeper in dark.

## Shapes

Softly squared hardware corners: wells 6px, keys 7px, the commit key 9px, the status bezel 10px. No pills, no circles except the LED. Drop bays carry a fine 45-degree hatch so they read as an empty slot.

## Components

### Commit key (Convert to Diagram)
- **Shape:** full-width, 54px tall, 9px corners.
- **Rest:** Safety Orange with near-black legend and a keyboard hint (Cmd+Enter / Ctrl+Enter, hidden on touch screens).
- **Working:** stays pressed, reads "Converting...", and a Cancel key appears beside it.
- **Disabled:** becomes a plain key, no orange.

### Mode keys (Text / File / Image)
- **Role:** a real tablist; arrow keys, Home and End move between modes.
- **Selected:** pressed position, bold legend, lit amber LED top-right.

### Status window
- **Content:** state word, mm:ss clock with ghost 88:88 cells, one detail line (the conversion summary when plotted).
- **Accessibility:** a polite live region announces the state; the clock is hidden from screen readers.

### Input wells
- **Text field:** recessed well, orange caret, character meter below that turns fault-colored past 100,000 characters.
- **Drop bays:** hatched recessed slot; drag-over draws a 2px orange inner ring; invalid files show an inline message before anything is uploaded; a loaded file sits in a slot row with a remove key.

### Example cells
Coded cells (A1-A4) in a two-column grid; code in dim mono, title in body sans. Pressing one fills the text field.

### Canvas empty state
Hand-drawn illustration of a note becoming a flowchart (inverted with the same filter Excalidraw uses in dark mode), a title and one hint. It is non-interactive and disappears once anything is on the canvas.

## Do's and Don'ts

### Do:
- **Do** keep every control a real button, tab or separator with keyboard support; the keycap look is a skin on standard affordances.
- **Do** name state in words in the status window whenever something changes.
- **Do** keep the orange for the single commit action.
- **Do** keep Excalidraw's own editor UI untouched.

### Don't:
- **Don't** add a second orange element or use orange for decoration.
- **Don't** set sentences in Martian Mono.
- **Don't** put kickers or eyebrow labels above headings.
- **Don't** add glow halos beyond the small mode LED.
