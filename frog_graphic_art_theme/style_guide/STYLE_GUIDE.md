# Ribbit sticker style guide (Phase 4, Stage 1)

This guide turns the ten style references in `../basis_raw/` into measurable rules for drawing Ribbit and theming KT-Hydration-Nation-Station. It is the input for Stage 2 (original Ribbit SVG set) and Stage 3 (app mockups). Nothing in this folder is part of the app build.

Swatch sheet: [`palette.svg`](palette.svg), rendered to [`palette.png`](palette.png) (1200×1740).

## 1. Provenance

- The ten references (`IMG_4063.JPG`–`IMG_4072.JPG`) are third-party artwork. `IMG_4067` carries a Xiaohongshu watermark (`leo_8410`). They stay in the git-ignored `basis_raw/` folder.
- We adopt the **style** (flat fill, thick single outline, dot eyes, line mouth, one held object). We never trace, copy, embed, upscale or redistribute the drawings. No path, silhouette or pose in our SVGs is taken from a reference; every drawing is constructed from the rules below.
- Measured numbers and hex colours are facts about the style, not artwork. Everything in `style_guide/`, `ribbit_svg/` and `mockups/` is original work for this project.

## 2. Reference survey

Method: each JPEG was converted to BMP with `sips`, then measured with `scratch/measure.py` (Python stdlib). Pixels were classified as ink (max channel < 100), green, pink or white. "W" is the frog's outer width: the largest green region's width plus two outline widths. Stroke is the median length of ink runs between frog green and white background, measured horizontally and vertically. Colours are medians of interior pixels (at least 2 px from any edge), so they are cleaner than edge samples.

| Ref | Canvas | Pose and object | W (px) | Stroke | Stroke / W | Eye dot / W | Mouth / W | Body green | Object colour, size |
|---|---|---|---|---|---|---|---|---|---|
| 4063 | 476 | Two frogs face to face, one reaching out | 170¹ | 8 | 4.7 % | 4.7–5.3 % | 33 % | `#B5E978` | none |
| 4064 | 342 | Two frogs side by side, tiny heart floating above | 100 | 6 | 6.0 % | 6–7 % | 30 % | `#B5E97A` | heart, not measured (tiny) |
| 4065 | 720 | Hugs a heart against one side | 113 | 7 | 6.2 % | 6.2 % | 28 % (slight smile) | `#A8EA6B` | `#FA7E7D`, 0.62×W |
| 4066 | 1000 | Holds a big heart overhead with both arms | 127² | 9 | 7.1 % | 7.9 % | 41 % (smile) | `#A6EC66` | `#F44B58`, 1.56×W |
| 4067 | 1000 | Holds a heart out on one long arm (watermarked) | 212² | 10 | 4.7 % | 5.2–5.7 % | 28 % | `#A6EC66` | `#FE5175`, 1.39×W |
| 4068 | 1118 | Hugs a heart to the chest, eyes with white glints | 328 | 12 | 3.7 % | 9.5 % | 19 % | `#98EE76` | `#FD7C97`, 0.42×W |
| 4069 | 1024 | Tiny frog under a giant heart balloon | 114 | 9 | 7.9 % | 8.8–9.6 % | 50 % | `#A8EC6A` | `#F87DAE`, 8.6×W |
| 4070 | 1000 | Tiny frog peeking up, holding a giant heart | 101 | 9 | 8.9 % | 7.9 % | 40 % | `#A6EC66` | `#FF6CA8`, 9.3×W |
| 4071 | 640 | Hugs a heart from behind, "FOR YOU" lettering | 82 | 6 | 7.3 % | 8.5–9.8 % | n/a (hidden) | `#A7EB69` | `#FFA1C6`, 0.91×W |
| 4072 | 1125 | One frog hugs another, tiny heart floating above | 128¹ | 10 | 7.8 % | 8.6 % | 41 % | `#A6EB65` | heart, not measured (tiny) |

¹ The two frogs' green areas may touch, so W can span more than one frog. ² W includes raised or outstretched arms, which lowers the ratio.

Ink colour in every image measured `#030704`–`#090D02` (near-black). Object outlines measured 1.0–1.2× the frog stroke (7.5 vs 7, 10 vs 9, 12 vs 10, 13 vs 12), so the artist uses one brush for everything.

## 3. Measured proportions

All values are a fraction of the character's outer width **W** (outline included), from the front-facing references (4064, 4065, 4068, 4071, 4072) unless noted.

| Feature | Measured | Rule for Ribbit |
|---|---|---|
| Outline weight | 3.7–8.9 % of W, median 6.7 % across all ten | **6.5 % of W**, constant everywhere on the character and its object |
| Overall shape | width ≈ height (0.95–1.10); squat poses 1.3 : 1 | Sitting Ribbit: W : H = 1 : 0.95 |
| Head | widest row at 30–40 % of height; that row is the full W | Head is the top 45 % of the height, cheeks reach full W |
| Eye bumps | two bumps in the top 10–15 % of height, notch between them; row at 10 % height is 0.47–0.65 W wide | Two bumps, each about 0.30 W wide, notch depth about 0.06 W |
| Body | 80–90 % of head width, near-vertical sides, flat base | Body 0.85 W wide, side walls straight or slightly bowed out |
| Eyes | solid dots 4.7–9.8 % of W (median about 8 %); centres 22–32 % of W apart (front-facing about 30 %) | Dot diameter **0.08 W**, centres **0.30 W** apart, centred in the bumps |
| Eye glint (4068 only) | white dot inside a larger eye (eye about 9.5 % of W) | Optional: eye grows to 0.10 W, white glint 0.04 W at upper-left |
| Mouth | straight line, 19–50 % of W (median about 30 %); thickness equals the stroke | **Flat line 0.28 W long**, stroke weight, round caps, centred between the eyes, about one eye-diameter below the eye centres (about 20 % of height from the top) |
| Arms | short open "C" or "U" strokes from the body side, no closed limb shape; length about 0.20–0.25 W | Same: open stroke, round caps, length 0.22 W; a raised arm can reach 0.4 W |
| Feet | two tiny bumps at the base corners, or just a flat base with a small notch | Two bumps about 0.15 W wide, or none |
| Held object | chest hug 0.42–0.91 W; overhead 1.39–1.56 W; comedic giant 8.6–9.3 W | Chest 0.45–0.6 W; overhead 1.2–1.5 W; giant only for the 100 % celebration |
| Whitespace | frog fills 10–36 % of canvas width (median about 14 %) | Clear space at least 0.25 W on every side; never crop the outline |
| Corners | head and cheeks are near-circular; base corners tight (radius about 0.06–0.08 W) | Build from circles: cheeks r ≈ 0.24 W, bumps r ≈ 0.14 W, base corners r ≈ 0.07 W, feet r ≈ 0.05 W |

Hand-drawn feel: the reference outlines wobble slightly and nothing is perfectly symmetric. In SVG, avoid perfect circles for the body: nudge Bézier control points by 1–3 % of W and tilt the face 2–4° when the pose allows.

## 4. Drawing rules

1. **One ink outline.** Every filled shape has a single `--ink` stroke at 6.5 % of W, round joins and round caps. No double lines, no inner contour lines except arms and mouth.
2. **Flat fills only.** No gradients, no shading, no highlights on the body, no blur, no drop shadows. Transparency is not used on the character.
3. **Eyes are dots.** Solid ink circles. The only allowed variants are the white glint (happy and hydrated), closed-eye arcs (sleeping) and a droopy lid line (parched).
4. **Mouth is a line.** Flat by default; a shallow upward curve for content and happier; never teeth, tongue or open mouth.
5. **Always one held object.** Ribbit holds at most one object. Hydration objects are water: a drop, a glass or a bottle. A heart is allowed only as a celebration or affection accent.
6. **Floating accents are small and few.** Sparkles, a tiny heart, "zZ" or a "!" float near the head, never held, at most three per drawing, each no larger than 0.25 W.
7. **Object uses the same brush.** Its outline is the same stroke width as the frog (1.0–1.2× is acceptable when scaled).
8. **No cheeks by default.** The references have none. `--blush` ovals (no outline, 0.12 W × 0.07 W, under each eye) are allowed only for happy and hydrated.
9. **Keep stroke count low.** A finished Ribbit is about 8–12 paths: body, two eyes, mouth, two arms, object, up to three accents.
10. **Constant line weight across sizes.** Scale the stroke with W. At small sizes, raise it to the minimums in section 8; never let it drop below 1.5 px at 1×.
11. **Dark backgrounds get a sticker edge.** On dark surfaces the character keeps its ink outline and gains an outer edge in `--sticker-edge`, 4.5 % of W wide, outside the ink line (draw the silhouette twice: first stroke = ink width + 2 × edge in edge colour, then the normal artwork).

## 5. Ribbit states

Driven by today's progress (Requirements 3.4) plus the app states. Only the listed parts change; everything else follows section 3.

| State | Trigger | Body | Eyes | Mouth | Pose and held object | Floating accents |
|---|---|---|---|---|---|---|
| Parched | 0–24 % | `--ribbit-parched` | dots lowered, with a flat lid line across the top half | short flat line, ends turned down slightly | slumped (height −8 %), arms hanging, holds an empty glass low | tiny puddle under the base |
| Waking | 25–49 % | `--ribbit-green` | dots | flat line | upright, holds a small drop at the chest | none |
| Content | 50–74 % | green | dots | shallow smile | hugs a drop at the chest (0.5 W), sits on the water line | none |
| Happy | 75–99 % | green | dots with glint | wider smile | arms higher, drop held up near the chin, sits on a lily pad | blush; one sparkle |
| Hydrated | 100 % | green | dots with glint | wide smile | both arms overhead holding a big drop (1.3 W) | crown or party hat in `--crown`; two sparkles; optional tiny heart |
| Paused / snoozed | pause or snooze active | green | closed arcs (downward curves, 1.6× eye width) | flat line | sitting, arms tucked, no object | "zZ" in `--ink-muted` |
| Reminder due | reminder fired, not yet logged | green | dots | flat line | one arm raises a drop overhead, the other waves | small "!" bubble |
| First-run welcome | Setup, empty data | green | dots with glint | shallow smile | one arm waving, no object | speech bubble "Hi! I'm Ribbit" in the UI, not in the drawing |
| Goal-met celebration | moment the goal is reached | green | dots with glint | wide smile | hydrated pose | burst of 6–8 small drops and hearts, animated once, then back to hydrated |

## 6. Colour tokens

### Light ("sticker on paper")

| Token | Hex | Role |
|---|---|---|
| `--ribbit-green` | `#A6EC66` | Frog body; primary button fill. Exact interior median in 4066, 4067, 4070; within 4 per channel in 4069, 4071, 4072. |
| `--ribbit-parched` | `#D3ECB4` | Frog body in the parched state |
| `--ink` | `#141414` | Character outline, eyes, mouth, body text, UI outlines |
| `--glint` | `#FFFFFF` | Eye glint, drop glint |
| `--blush` | `#FFB0C8` | Optional cheeks (happy, hydrated) |
| `--drop` | `#7CCCF2` | Water drop, glass and bottle water, chart bars |
| `--pond` | `#CBEBFB` | Pond water-level fill on the home screen |
| `--water-strong` | `#1C6FA3` | Blue text, pond surface line, chart goal line |
| `--heart` | `#FF6CA8` | Celebration heart (measured bubblegum in 4070) |
| `--heart-coral` | `#F4505E` | Alternate heart accent (close to the measured coral `#F44B58` in 4066) |
| `--crown` | `#FFD54A` | Crown, party hat, sparkles |
| `--paper` | `#FFFFFF` | App background (the references are pure white) |
| `--cream` | `#FFF9E5` | Tip card and inset panels (lightened Sunny Cream) |
| `--ink-muted` | `#5B635E` | Secondary text |
| `--deep-pond` | `#1F6F5B` | Links, focus ring, selected nav item |
| `--danger` | `#C0303C` | Destructive text and "Erase everything" |

### Dark ("night pond")

The frog itself does not change: same green, same ink outline, plus the sticker edge (rule 11).

| Token | Hex | Role |
|---|---|---|
| `--bg` | `#0F2E2A` | Background (existing Dark Pond, kept) |
| `--surface` | `#18423B` | Cards |
| `--text` / `--sticker-edge` | `#F3F8F1` | Text, and the outer edge around characters and objects |
| `--text-muted` | `#A9C3B7` | Secondary text (existing value, kept) |
| `--accent` | `#A8E69A` | Links, focus ring, selected nav item (existing value, kept) |
| `--ui-line` | `#7FA59A` | Input and card borders (ink borders disappear on dark) |
| `--ribbit-green`, `--ribbit-parched`, `--ink`, `--glint`, `--blush`, `--drop`, `--crown` | same as light | Character and objects |
| `--pond` | `#1D5670` | Pond water-level fill |
| `--water-strong` | `#8FD6FF` | Blue text and pond surface line on dark |
| `--heart` | `#FF7DB3` | Celebration heart |
| `--danger` | `#FF8A8A` | Destructive text |

### Contrast check (WCAG 2.x, `scratch/contrast.py`)

All text pairs pass 4.5 : 1 and all non-text pairs pass 3 : 1:

- Light: ink on paper 18.4, ink on cream 17.5, ink-muted on paper 6.2 and on cream 5.9, ink on ribbit-green (button labels) 13.0, ink on drop 10.3, ink on heart 7.0, deep-pond on paper 6.0, water-strong on paper 5.5, danger on paper 5.6.
- Dark: text on bg 13.5 and on surface 10.4, text-muted on bg 7.7 and on surface 5.9, accent on surface 7.7, water-strong on surface 7.0, danger on surface 4.9, ribbit-green button on bg 10.3, ui-line on surface 4.1, drop on bg 8.2, heart on bg 6.1.
- Pastel fills (`--ribbit-green` on paper 1.4, `--pond` on bg 1.8) are below 3 : 1 on purpose. The ink outline (light) or `--ui-line`/sticker edge (dark) carries the boundary contrast, so a fill colour is never the only thing marking an edge.

### Reconciling the current `src/styles/tokens.css`

| Current token | Current hex | Proposal |
|---|---|---|
| `--lily-green` | `#6BBF59` | Replace with `--ribbit-green` `#A6EC66` for the character and button fills. Lighter and yellower, as in the references. |
| `--deep-pond` | `#1F6F5B` | Keep as the text-safe green (links, focus, active nav). |
| `--pond-blue` | `#4FA3D1` | Split into `--drop` `#7CCCF2` (fills) and `--water-strong` `#1C6FA3` (text and lines); 4FA3D1 is 2.9 : 1 on white, too low for text. |
| `--sunny-cream` | `#FFF7D6` | Background becomes `--paper` white; cream lightens to `--cream` `#FFF9E5` for inset panels only. |
| `--dark-pond` | `#0F2E2A` | Keep as the dark background. |
| `--blush` | `#F7A7B8` | Becomes `#FFB0C8` and is used only on happy and hydrated. |
| `--fly-black` | `#2B2B2B` | Replace with `--ink` `#141414`, closer to the measured near-black outline. |
| `--shadow` | soft blur | Remove: flat sticker look, no blur shadows (rule 2). |

Proposed `tokens.css` shape for Phase 4 (not applied in this stage):

```css
:root {
  --ribbit-green: #a6ec66; --ribbit-parched: #d3ecb4; --ink: #141414; --glint: #ffffff;
  --blush: #ffb0c8; --drop: #7cccf2; --pond: #cbebfb; --water-strong: #1c6fa3;
  --heart: #ff6ca8; --heart-coral: #f4505e; --crown: #ffd54a;
  --bg: #ffffff; --surface: #ffffff; --surface-inset: #fff9e5;
  --text: var(--ink); --text-muted: #5b635e; --accent-strong: #1f6f5b; --danger: #c0303c;
  --ui-line: var(--ink); --sticker-edge: transparent;
  --stroke-ui: 2px; --radius-s: 12px; --radius-m: 20px; --radius-l: 28px; --radius-pill: 999px;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0f2e2a; --surface: #18423b; --surface-inset: #18423b; --pond: #1d5670;
    --water-strong: #8fd6ff; --heart: #ff7db3; --text: #f3f8f1; --text-muted: #a9c3b7;
    --accent-strong: #a8e69a; --danger: #ff8a8a; --ui-line: #7fa59a; --sticker-edge: #f3f8f1;
  }
}
```

The colours the parent pre-sampled (`#9CE460`–`#B4E478` green, `#F04854` coral, `#FC6CA8`/`#F078A8` pink) agree with these interior medians; edge samples read slightly darker because of JPEG blending with the outline.

## 7. Applying the style to the interface

- **Outlines over shadows.** Light mode: cards, inputs, buttons and the pond gauge use a `--stroke-ui` (2 px) ink outline and no shadow. Dark mode: cards drop the outline and rely on `--surface`; inputs use `--ui-line`.
- **Buttons.** Primary (quick-add +150/+250/+500): pill, `--ribbit-green` fill, ink outline (light only), ink label in Nunito 800. Secondary: paper fill with ink outline (light) or surface fill with `--ui-line` (dark). Destructive: `--danger` text on a neutral button.
- **Pond.** A rounded rectangle (radius-l) with ink outline; water is a flat `--pond` fill with a 3 px `--water-strong` surface line; the level animates with `transform`, no gradient.
- **Week bars.** `--drop` fill with ink outline (the outline gives 3 : 1 contrast); goal line dashed `--water-strong`; a day that met the goal shows a tiny lily pad or heart, not a colour change alone.
- **Radii.** 12 px for small chips, 20 px for cards, 28 px for the pond, pill for buttons.
- **Whitespace.** The frog never touches a card edge (clear space 0.25 W). Hero frog on the Pond screen about 180–220 px wide in the 420 px window.
- **Motion** (Phase 4): blink, gentle bob, a one-shot celebration; respect `prefers-reduced-motion`.

## 8. Sizes and stroke minimums

| Use | Frog width W | Ink stroke | Notes |
|---|---|---|---|
| Pond hero | 180–220 px | 12–14 px (6.5 %) | Full detail |
| Inline (tip card, setup, toasts in-app) | 64–96 px | 4–6 px (min 4) | Drop glint optional |
| App icon master | about 820 px on a 1024 canvas | 56 px (about 7 %) | Ribbit plus a drop on a `--paper` or `--pond` rounded square; keep 0.1 × canvas padding for Windows icon masking |
| Tray 32 px | 26–28 px | 2.5–3 px (about 10 %) | Head only: bumps, eyes, no mouth or arms |
| Tray 16 px | 14 px | 1.5–2 px (about 12 %) | Head silhouette with two 2 px eyes; fill `--ribbit-green` so it reads on both light and dark Windows taskbars |

## 9. Typography

All four candidates are SIL Open Font License 1.1 (confirmed in the `google/fonts` METADATA for each family). OFL allows bundling the font files inside the app installer as long as the font is not sold on its own and the licence text ships with it. Measured from the variable TTFs downloaded to `scratch/fonts/` with `scratch/fontfeat.py` and `scratch/digitwidths.py`:

| Family | Weight axis | Scripts | TTF size | Default figures | Fit with the sticker style |
|---|---|---|---|---|---|
| **Nunito** | 200–1000 | Latin, Latin-ext, Cyrillic, Vietnamese | 270 KB | **tabular** (all digits 600 units) | Rounded terminals; 800–900 weights match the thick ink outline; 500–600 stays legible at 13–16 px |
| Baloo 2 | 400–800 | Latin, Latin-ext, Devanagari, Vietnamese | 667 KB | proportional (has a `tnum` feature) | Very chunky and playful; heavy at small sizes; largest file because of Devanagari |
| Quicksand | 300–700 | Latin, Latin-ext, Vietnamese | 121 KB | proportional, no `tnum` | Thin geometric strokes clash with the thick outlines; weak contrast for UI text |
| Fredoka | 300–700, width 75–125 | Latin, Latin-ext, Hebrew | 155 KB | proportional, no `tnum` | Closest to the bold lettering in 4071; strong for headings, but no tabular figures and fewer weights for body text |

**Recommendation: Nunito**, bundled as one variable file (subset to Latin and converted to WOFF2 in Phase 4, with `OFL.txt` alongside). Reasons:

1. Its default digits are tabular, so "1,250 / 2,000 ml" and the bar labels do not shift width as numbers change or animate. Fredoka and Quicksand have no tabular option.
2. One file covers both the heavy display weights (900 for the progress number, 800 for buttons) and comfortable body text (500–600), so the app ships one font instead of two.
3. It is already first in the `--font` stack in `src/styles/tokens.css`, so adopting it is a bundling task, not a redesign.

Usage: progress number 900 at 40–48 px; headings 800 at 20–24 px; buttons 800 at 16–18 px; body 600 at 15–16 px; captions 600 at 13 px. Fredoka remains the alternative if the user wants chunkier headings in the mockups (it would be a second bundled file).

## 10. Known unknowns

- Exact Windows rendering of a 1.5 px stroke at 16 px tray size at 125–200 % scaling needs checking in the Windows VM (Phase 5).
- Whether pure `--paper` white is too bright for long sessions; the mockups (Stage 3) should show a white and a cream background variant.
- The WOFF2 subset size of Nunito is not measured yet (the TTF is 270 KB before subsetting).

## 11. Reproduce

The scripts live in the git-ignored `scratch/` folder (stdlib Python, no dependencies), so they exist only on the development Mac.

```bash
cd /Users/bbaluyot/Documents/Kiro-galo/frog_graphic_art_theme
for f in basis_raw/*.JPG; do b=$(basename "$f" .JPG); sips -s format bmp "$f" --out "scratch/bmp/$b.bmp"; done
python3 scratch/measure.py        # proportions, stroke, colours
python3 scratch/contrast.py       # WCAG contrast of token pairs
python3 scratch/make_palette.py   # writes style_guide/palette.svg
rsvg-convert style_guide/palette.svg -o style_guide/palette.png
```
