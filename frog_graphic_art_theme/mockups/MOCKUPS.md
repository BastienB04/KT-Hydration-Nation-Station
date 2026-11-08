# KT-Hydration-Nation-Station: design directions (Phase 4)

Stage 3 offered three directions. The user chose one on 7 Nov 2026 (next section). Nothing in this folder is part of the app build. The A and B material below is kept as history.

## Decision (7 Nov 2026): Direction C + dark mode

- **Direction C "Playful cards" is the app design.** The user chose it for its thick ink borders, which make each feature easier to read and navigate.
- **Dark mode comes from B.** C gains a dark theme on B's Dark Pond page, drawn with C's card system. New screens: [`C-playful-cards/pond-48-dark.png`](C-playful-cards/pond-48-dark.png) and [`C-playful-cards/settings-dark.png`](C-playful-cards/settings-dark.png), both also on [`overview-C.png`](C-playful-cards/overview-C.png).
- **Theme setting.** Settings gets a "Theme" row with a three-way control: System (default), Light, Dark. System follows the operating system's light/dark preference. Light and Dark override it. The choice applies the moment it is picked; the Settings Save button does not change it, and Reset returns it to System.
- **Settings group rename.** C's third group "Ribbit" becomes "Ribbit & app", because it now holds an app setting (Theme) next to Ribbit sound, Launch at login, Check for updates and Frog name. Row pitch tightens from 36 to 34 px and the gap between groups from 12 to 10 px, so Save settings and Reset all data still sit above the dock (the buttons end at y 638, the dock starts at y 660).
- **Page and surface rule.** C keeps a cream page with white surfaces (cards, dock). Cream is also the inset colour (fields, tip card, Snooze and Pause pills, off switches). This replaces STYLE_GUIDE's "cream for inset panels only" rule for the app.
- **Dark values that supersede STYLE_GUIDE §6 for C.** The dark surface is `#173F3A` (STYLE_GUIDE had `#18423B`). Thick card and control borders use a pale line `#D5E7DC` (STYLE_GUIDE's `--ui-line` was `#7FA59A`), so C's marker borders stay visible on dark at 9.0 : 1 against the surface. Ribbit, the lily pads, the drops and the dock glyphs get the rule 11 sticker edge `#F3F8F1` on dark. Ribbit's own colours never change.
- **Pond at 100 %.** The app's reading of `pond-100.png`: the steady 100 % state shows `ribbit-hydrated` (crown, Requirements 3.4). The arms-up `ribbit-celebrate` pose with a small burst of drops, hearts and sparkles plays once when the goal is reached during the session, then returns to `ribbit-hydrated`.
- **Week caption (Stage 3 review finding, resolved).** The caption under the streak number now names the streak days: "Tue, Wed and Thu in a row." The earlier wording read as if only those three days reached the goal, although Sun did too. "4 of 7 days at goal" stays separate in the summary card. In the app this caption is built from the real log, not hardcoded.
- **Today's sips link.** The mockup's "4 sips · see all" becomes "4 sips · Show all" / "Show fewer" in the app, a toggle that expands the list in place.

### Token mapping (light and dark)

| Semantic token | Light | Dark | Notes |
|---|---|---|---|
| `--page` | `#FFF9E5` cream | `#0F2E2A` Dark Pond | app/page background |
| `--surface` | `#FFFFFF` | `#173F3A` | cards, dock |
| `--surface-inset` | `#FFF9E5` | `#0F2E2A` | fields, tip card, Snooze/Pause pills, off switch |
| `--line` | `#141414` | `#D5E7DC` | thick card/control borders (9.0 : 1 on dark surface, 11.3 : 1 on page) |
| `--text` | `#141414` | `#F3F8F1` | 17.5 : 1 on cream / 10.8 : 1 on dark surface |
| `--text-muted` | `#5B635E` | `#A9C3B7` | 5.9 : 1 on cream / 6.2 : 1 on dark surface |
| `--link` / `--focus` | `#1F6F5B` | `#A8E69A` | 5.7 : 1 on cream / 8.0 : 1 on dark surface; focus = 3 px outline, 3 px offset |
| `--primary` / `--on-primary` | `#A6EC66` / `#141414` | same | 13.0 : 1 label |
| `--drop` | `#7CCCF2` | same | bars, drop icons, progress fill |
| `--pond` | `#CBEBFB` | `#1D5670` | progress track, today bar |
| `--water-strong` | `#1C6FA3` | `#8FD6FF` | goal line, legend text |
| `--heart` | `#FF6CA8` | `#FF7DB3` | |
| `--danger` | `#C0303C` | `#FF8A8A` | 5.6 : 1 on white / 5.1 : 1 on dark surface |
| `--sticker-edge` | `transparent` | `#F3F8F1` | rule 11 edge around Ribbit, pads and nav glyphs |
| `--ink`, `--ribbit-green #A6EC66`, `--ribbit-parched #D3ECB4`, `--crown #FFD54A`, `--lily #6BBF59`, `--blush #FFB0C8` | same | same | character colours never change |
| Stroke/radius | `--stroke-card 3.5px`, `--stroke-control 2.5px`, `--stroke-fine 2px`, `--radius-card 24px`, `--radius-pill 999px`, `--canvas-max 480px` | same | |

Contrast was computed with the WCAG 2.x formula (`scratch/contrast.py`). Every text pair is at least 4.5 : 1 and every border, control and focus pair at least 3 : 1. Other checked dark pairs: link/focus `#A8E69A` on page 10.0 : 1, water-strong `#8FD6FF` on surface 7.3 : 1, green buttons `#A6EC66` against the surface 8.2 : 1, the white switch knob on the inset track 14.5 : 1.

Selection never relies on colour alone. The selected dock item and Theme segment are their own outlined pill with a heavier label weight. The switches show state by knob position. Disabled controls use a dashed `--line` border and a `--text-muted` label. Errors use `--danger` text with a message, never colour alone.

### Direction C files

`C-playful-cards/` holds `pond-48`, `pond-100`, `week`, `settings`, `setup-1`, `pond-48-dark`, `settings-dark` (840×1440 PNG of the 420×720 window, SVG source next to each), `overview-C.png`, and `icons/` (`icon-app-C.svg` is the app icon source).

## Stage 3 notes (all directions)

The rest of this file is the Stage 3 proposal as shown to the user. Where it differs from the decision above, the decision wins.

Start with the overview sheets. Each one shows every screen at the real window size next to the app icon (128 px and 32 px), the tray icon at 16 px on light and dark taskbars, and a Windows toast:

- [`A-sticker-book/overview-A.png`](A-sticker-book/overview-A.png)
- [`B-pond-day-night/overview-B.png`](B-pond-day-night/overview-B.png)
- [`C-playful-cards/overview-C.png`](C-playful-cards/overview-C.png)

Each folder also has the individual screens at 2× (840×1440 PNG of the 420×720 window) and the SVG source next to each PNG: `pond-48`, `pond-100`, `week`, `settings`, `setup-1` (B also has `pond-48-dark`; C has `pond-48-dark` and `settings-dark` since the decision), and `icons/`.

### What all three share

- **Ribbit** is the approved Stage 2 SVG set (`../ribbit_svg/`), embedded path for path. The 48 % screens use `ribbit-waking`, Week uses `ribbit-happy` (A, C) or `ribbit-waking` on today's pad (B), Settings uses `ribbit-base` (A) or `ribbit-sleeping` (C), and Setup uses `ribbit-wave`. At 100 %, A and B show `ribbit-hydrated` (crown, lily pad) and C shows `ribbit-celebrate` (arms up). Ribbit holds a water drop on the Pond and Week screens and on A's Settings screen. Three poses hold nothing: `ribbit-wave` on every Setup screen (one arm waves), `ribbit-celebrate` on C's 100 % screen (both arms up) and `ribbit-sleeping` on C's Settings screen. Hearts appear only in the 100 % celebration and as "goal met" markers on Week. In Direction C, Ribbit peeks over a card edge, so its floating extras (sparkles, zZ) are dropped there and the celebration burst is drawn around it instead. A's 100 % screen also drops the hydrated pose's own sparkles, which would sit on the Snooze button, and draws two more sparkles into its burst.
- **Colours** are the Stage 1 light tokens: `--ribbit-green #A6EC66` buttons, `--ink #141414` outlines, `--drop #7CCCF2`, `--pond #CBEBFB`, `--water-strong #1C6FA3`, `--deep-pond #1F6F5B` links, `--cream #FFF9E5`, `--danger #C0303C`. The dark screen in B uses the Stage 1 dark tokens, with the sticker edge (`#F3F8F1`) around Ribbit and the lily pads. Lily pads use `#6BBF59`, the proposed `--lily-pad` token from Stage 2.
- **What happens to today's `tokens.css` colours** follows the table in [STYLE_GUIDE "Reconciling the current tokens.css"](../style_guide/STYLE_GUIDE.md#reconciling-the-current-srcstylestokenscss) in all three directions. Lily Green `#6BBF59` is no longer the character or button colour (`--ribbit-green` takes over) and stays only as the lily-pad fill. Pond Blue `#4FA3D1` splits into `--drop` for fills and `--water-strong` for text and lines. Deep Pond `#1F6F5B` stays as the text-safe green. Dark Pond `#0F2E2A` stays as the dark background. Sunny Cream `#FFF7D6` lightens to `--cream` `#FFF9E5`. The directions differ only in where cream goes, as each section below says. A follows the style guide exactly (white page, cream only for inset panels). B and C use cream as the page colour, which departs from the style guide's "cream for inset panels only" rule. If you pick B or C, that rule changes to "cream page, white surfaces".
- **Typeface** is Nunito (variable, weights 600–900). The renders used the real Nunito file (`scratch/fonts/Nunito.ttf` from google/fonts), loaded through a local fontconfig file. Nothing was installed system-wide and no fallback font was needed. The app would bundle Nunito as WOFF2 (Stage 1 plan). Emoji do not render in this pipeline, so the toast shows a frog-head drawing where Windows would show 🐸.
- **Copy** is the app's real copy and Ribbit's voice: "Next sip around 14:30", "Goal met. Nice hopping!", "Goal met. Ribbit is delighted.", the nav labels Pond · Week · Settings · About, "Snooze 10 min" (the app's label with the default 10-minute snooze length), "Step 1 of 3", "Your daily goal" and the fluid disclaimer. Tips are verbatim from `src/data/tips.json`.
- **Sample data** is Friday 6 Nov 2026 with a 2,000 ml goal. The 48 % screens show 950 ml from 4 sips (08:40 250, 10:15 150, 11:30 300, 13:05 250). The 100 % screens show 2,000 ml from 8 sips. The week is Sat 1,400 · Sun 2,100 · Mon 1,750 · Tue 2,000 · Wed 2,250 · Thu 2,050 · Today 950, which gives a 3-day streak, 4 of 7 days at goal and an average of 1,786 ml.
- **Icons**: the tray icon is the Stage 2 head silhouette in every direction (`icon-tray`, plus `icon-tray-due` with the drop badge). It is the only shape tested to read at 16 px. A uses the Stage 2 app icon unchanged. B and C have their own app icon in `icons/icon-app-B.svg` and `icons/icon-app-C.svg`.

### Changes these mockups make to today's screens (all directions)

These were layout proposals. The decision above confirms them for C.

- **Pause**: the four buttons (30 min, 1 h, 2 h, rest of day) become one "Pause ▾" menu next to "Snooze 10 min". The menu offers the same four options, and "Resume" replaces "Pause" while reminders are paused. Snooze and Pause stay on screen in every state, including the 100 % "Goal met. Nice hopping!" screens, as they do today. In C the status text wraps onto two lines to make room for them.
- **Today's sips** shows only the newest 2–4 sips with "show all" or "Edit". This keeps the whole Pond screen inside 720 px without scrolling. The full list with edit and delete opens from that link.
- **Undo last sip** is shortened to "Undo" with an arrow icon.
- **Settings** uses a compact row layout (label on the left, control on the right) and switches instead of checkboxes. The long "Check for updates" hint is shortened (A) or dropped (B, C). The day buttons are abbreviated: A uses two letters (Mo, Tu …) and B and C use one letter (M, T …), where the app shows Mon–Sun. A and B keep the app's field labels. C shortens four of them: "Quick-add amounts (ml)" → "Quick-add (ml)", "Reminder interval (min)" → "Every (min)", "Snooze length (min)" → "Snooze (min)", "Play the ribbit sound" → "Ribbit sound". B and C also group the rows under headings (Goal, Reminders, Ribbit). Since the decision, C's third heading is "Ribbit & app" and adds the Theme row.
- **Setup step 1** gets −/+ buttons on the goal field in all three directions. Steps 2 and 3 would reuse the same frame.

## Direction C: "Playful cards" (selected)

Soft cream page (`--cream` `#FFF9E5`) with large white cards. Fields, the tip card and the Snooze and Pause buttons are cream too. Every card, button and field has the same thick `--ink` outline as Ribbit (3.5 px), so everything looks drawn with one marker. Deep Pond appears only in links and the setup tip. Big friendly numbers (60 px "950", 72 px streak "3"). Ribbit peeks over the top-right corner of the main card in each screen, holding its drop. The quick-add buttons carry drops sized by amount. The bottom nav is a rounded dock of tiny drawn glyphs: a drop (Pond), a calendar on a lily pad (Week), a gear (Settings) and Ribbit's face (About).

- **Pros:** the most playful and distinctive look, and the most "illustrated app". Clear sections make it easy to scan. The peeking Ribbit fits small windows (360 px minimum width) better than a big hero. The glyph nav makes the frog theme part of the controls.
- **Cons:** the densest layout, with five cards on Pond. The thick outlines everywhere make it the loudest. It needs the most new CSS: card system, dock and peek positioning. The glyph labels are small (11 px).
- **CSS notes:** cards are `border: 3.5px solid var(--ink); border-radius: 24px`. The peeking Ribbit is an absolutely positioned SVG behind the card (`z-index` below the card) with its lower body hidden by the card. The dock is a fixed bottom flex row.

## Rejected alternatives (history)

The user did not pick A or B. B's dark theme lives on in C's dark mode. These sections are kept unchanged as the record of what was offered.

### Direction A: "Sticker book"

Pure white page. A large Ribbit (about 176 px wide) sits in the middle of a simple blue rounded pond whose water rises with progress, like the reference stickers. Chrome is minimal: pastel green pill buttons with a 2 px ink outline, plain text rows, no cards, and a text-only bottom nav where the current page sits in a green pill. Tokens: the page is `--paper` white, cream appears only in the tip card (inset panel), and outlines are `--ink`. This is the style guide's reconciliation applied as written.

- **Pros:** closest to the reference style. The calmest and most readable layout. The fewest new components, since it is mostly restyled versions of today's components. The white background makes Ribbit pop.
- **Cons:** pure white can feel bright over a long day (Stage 1 open question). It has the least "pond world" personality. The nav has no icons, so the four labels carry it alone. Dark mode is not shown; it would follow B's dark tokens.
- **CSS notes:** the pond is a `border-radius: 50px` box with the water as an inner element whose `height` (or `transform: scaleY`) follows the percentage. Ribbit is absolutely positioned over it. Bars on Week are flex children with `height: %`.

### Direction B: "Pond at day / night"

Today's teal and cream palette, lightened. The page is cream (`--cream` `#FFF9E5`, today's Sunny Cream lightened), the surfaces are white, and outlines and headings use Deep Pond green `#1F6F5B` in place of ink. The night theme uses Dark Pond `#0F2E2A` as the page. The progress gauge is a round pond: the water level is the progress, and Ribbit floats on a lily pad that rides the surface, so at 100 % Ribbit rises above the rim with a crown. A 7-pad streak row sits under the numbers, with flowers on goal days and a dashed pad for today. Week keeps today's horizontal-bar layout under a lily-pad "garden" strip. `pond-48-dark.png` shows the night-pond theme that follows Windows dark mode: dark teal page, starry sky in the pond and sticker edges around Ribbit.

- **Pros:** keeps continuity with the current app and the original "nature" palette. The pond and lily-pad metaphor carries the whole app (Requirements 3.4 lily-pad streak and pond water level). It is the only direction with a worked-out dark mode. The nav has clear icons.
- **Cons:** the busiest Pond screen (pond, streak row, buttons, chips and tip all on one page). Ribbit is smaller (about 110 px wide) to fit the circle. The teal outlines feel a little less "sticker" than A's or C's ink outlines. The sips chips need an edit mode to delete entries.
- **CSS notes:** the pond is a `border-radius: 50%` element with `overflow: hidden`. The water is an inner block with a wavy SVG top edge. The water level is linear: at 1× the circle spans y 78–302 and the water line is y = 298 − 216 × progress, so 48 % fills about 49 % of the circle's height and 100 % fills the whole circle. Ribbit's pad rides the surface with `transform: translateY()`, clamped between y 142 and 268 so he always fits on screen. Above about 72 % the water passes the clamp, so at 100 % Ribbit sits in a full pond with his crown above the rim. The streak row is seven inline SVG pads.

### How to choose (Stage 3)

- Want it to look like the reference stickers? Choose **A**.
- Want the pond story and a dark mode that follows Windows? Choose **B**.
- Want the most character and are happy with a busier screen? Choose **C**.

Mixing is fine. For example, A's layout with B's round pond and dark theme, or C's glyph dock on A. Tell me which parts you want.

## Reproduce

The generator scripts are in the git-ignored `../scratch/mock/` folder (stdlib Python, so they exist only on the development Mac):

```bash
cd /Users/bbaluyot/Documents/Kiro-galo/frog_graphic_art_theme/scratch/mock
python3 dir_a.py && python3 dir_b.py && python3 dir_c.py && python3 overview.py
# C only (the decision): python3 dir_c.py && python3 overview.py C
```

They write each SVG and render it with `rsvg-convert` (screens at `-z 2`, overviews at 1×). For Nunito they set `FONTCONFIG_FILE=scratch/mock/fonts.conf` and `PANGOCAIRO_BACKEND=fc`.
