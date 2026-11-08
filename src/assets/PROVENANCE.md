# Asset provenance

Everything in `src/assets/` ships inside the app. All artwork (Ribbit, props, nav glyphs, icons) is original to this project, drawn as hand-written SVG for KT-Hydration-Nation-Station. Nothing here is traced from, derived from or copied out of the user's inspiration photos, which stay in the git-ignored design workspace and never ship.

The app reads these files only from `src/assets/` (inlined at build time through `import.meta.glob(..., { query: "?raw" })` in `src/components/ribbitArt.ts`). No source file imports from `frog_graphic_art_theme/`.

## Byte copies of the approved Stage 2 SVGs

Copied unchanged from `frog_graphic_art_theme/ribbit_svg/` (7 Nov 2026). Source and copy SHA-256 (`shasum -a 256`) are identical; `cmp` is silent.

| Copy in `src/assets/` | Source in `ribbit_svg/` | SHA-256 (source = copy) |
|---|---|---|
| `ribbit/ribbit-base.svg` | `ribbit-base.svg` | `de06797997d8c5ee60d26249e8c95e993e008d4db44b6f1fa39b326aafc71b06` |
| `ribbit/ribbit-parched.svg` | `ribbit-parched.svg` | `ce9bc729e1f64fc74ed956e51a5eea76e57e01936541aafdc952e444bdfae313` |
| `ribbit/ribbit-waking.svg` | `ribbit-waking.svg` | `68341f2e2c6895447d05962cc8295283c425e61a8e2ebc56c788e54ea2d26c29` |
| `ribbit/ribbit-content.svg` | `ribbit-content.svg` | `56221cbcd8a5c2f3d53aacb64b28dd92a115e1b0d59ddd388aa748e29d23ce2d` |
| `ribbit/ribbit-happy.svg` | `ribbit-happy.svg` | `07e80d66594b42dca9db45b19d7a4f3bc6bf86317649726b6a57be4bf36790dd` |
| `ribbit/ribbit-hydrated.svg` | `ribbit-hydrated.svg` | `feca4cda194db00af290e6070a6e997170d1fffc9800ab633b2be1f04723c3a6` |
| `ribbit/ribbit-sleeping.svg` | `ribbit-sleeping.svg` | `ac4963a76433fae00884b2e40adde16ea69df375ee2c35862c1413edbed25eb1` |
| `ribbit/ribbit-reminder.svg` | `ribbit-reminder.svg` | `11a18d5149fa2661649d6b79a8099cbf40cad1a7d6f0c40a3e6a73d6bf80f977` |
| `ribbit/ribbit-wave.svg` | `ribbit-wave.svg` | `e1625bedc078d6d6f6c127cdd83b28bf24662f799f2d8f643d4b1d0892b8078f` |
| `ribbit/ribbit-celebrate.svg` | `ribbit-celebrate.svg` | `8bcc675612aabee4851ddb3d45f9bfe02a73c0c4f2f7cdc933db56b6fbf615e7` |
| `props/water-drop.svg` | `water-drop.svg` | `b3d00329895bcb993daa98ea581bde3f4a4965be114601f4777d9e23f4dd756c` |
| `props/sparkle.svg` | `sparkle.svg` | `ee282545c4f13fa9036c2a2e0a47e456702f12f4e177d05a5ea6b8e9c3f03fc7` |
| `props/lily-pad.svg` | `lily-pad.svg` | `af0dcfbfb533d1efd2beb690d1190df6acef7eaf80436b4296539a4f2c576513` |
| `props/lily-pad-flower.svg` | `lily-pad-flower.svg` | `7e9c443b2da887240058916e9b7b45fa90a1e8557d1cda7db5af5fb1ee406aca` |
| `nav/pond.svg` | `water-drop.svg` | `b3d00329895bcb993daa98ea581bde3f4a4965be114601f4777d9e23f4dd756c` |
| `nav/about.svg` | `icon-tray.svg` | `b310c2b9d85fa5129433eed35944e72161cc1ea69edaa8f010d5fbfc9c035917` |

## Generated files

Written by the design-workspace exporter `frog_graphic_art_theme/scratch/mock/export_app_assets.py` (git-ignored scratch), which reuses the drawing helpers of the Direction C mockups (`scratch/mock/common.py`, `scratch/mock/dir_c.py`). They are drawn in the light theme; the app adds the dark sticker edge at runtime.

| File | Drawn by | SHA-256 |
|---|---|---|
| `nav/week.svg` | `dir_c.glyph("pad")`, calendar on a lily pad, 32 box | `7b4c3a2fc1abdaec5458bc52e193c803f78f536be8b5dbd5b143e8993ffeb11b` |
| `nav/settings.svg` | `dir_c.glyph("gear")`, 32 box | `a213db23f6b79e075241ecc5ce6099ef6189c0c7e80bd7e39ea7c2004d03c45b` |
| `props/heart.svg` | `common.heart_shape`, coordinates baked into a 128 box | `2cbdcec32af271350fd20afaedd36f6a30f4ceffe5535702cfcc0ea41f717896` |
| `icons/bell.svg` | `common.ICONS["bell"]`, 24 box, `currentColor` | `0b47ab48072e572c170f6acdd098b67d800f604bad8d1b5d0361c6ef4ab5661c` |
| `icons/check.svg` | `common.ICONS["check"]` | `e07479896c8a58aa9383382698f7db81907d34cb6986fde588c34a9785792c2a` |
| `icons/undo.svg` | `common.ICONS["undo"]` | `7ecd6e389ec0dfc00677a5b9c7562603e8391db5454b26300267834999f89cff` |
| `icons/pencil.svg` | `common.ICONS["pencil"]` | `605d6ec2b2c0b0974d264b187611b7f5e44830b1aa32151ba89a5fa9b734e669` |
| `icons/x.svg` | `common.ICONS["x"]` | `fcf7beb5cf1c69f9a3292af649977b74cf55fbfd6268947bd0a310d13f6cd594` |
| `icons/chev.svg` | `common.ICONS["chev"]` | `f27364947335d4ba00bac95e031e6d55137e4c34ff298093ede3bb56e93f019f` |
| `icons/plus.svg` | `common.ICONS["plus"]` | `e3e8ec4e48f95830859d8084a739e4d0233690acc42d28ed47cc5b094fcc4c3f` |
| `icons/minus.svg` | `common.ICONS["minus"]` | `474411132113cde975300ae1e77f16092b073ba15cc2262c565e2737eb72e3bd` |

## Font: Nunito

| Item | Value |
|---|---|
| File | `fonts/nunito-latin-wght.woff2` (variable, `wght` 200 to 1000, Latin subset) |
| Source | Google Fonts CSS2 API `https://fonts.googleapis.com/css2?family=Nunito:wght@200..1000&display=swap` (fetched with a desktop Chrome User-Agent), `/* latin */` block |
| Download URL | `https://fonts.gstatic.com/s/nunito/v32/XRXV3I6Li01BKofINeaBTMnFcQ.woff2` |
| Fetched | 2026-11-07 14:06 UTC |
| Size | 39,152 bytes; `file`: "Web Open Font Format (Version 2), TrueType" |
| SHA-256 | `20fc9b6fc618e7c3c68d3ac750a2a5dfbceb8521675458d2cea580b5693e4798` |
| `unicode-range` | `U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD` (copied into `src/styles/fonts.css`) |
| Licence | SIL Open Font License 1.1, "Copyright 2014 The Nunito Project Authors (https://github.com/googlefonts/nunito)" |
| Licence file | `public/licenses/Nunito-OFL.txt` from `https://raw.githubusercontent.com/google/fonts/main/ofl/nunito/OFL.txt`, 4,385 bytes, SHA-256 `580df76c95a1ec5ab878ceb25bb3d85c6a076804e9c970c8c6972aea775fdf65`. Vite copies it to `dist/licenses/Nunito-OFL.txt`, so it ships inside the app. |

The font is bundled; the app makes no network request for it at runtime.
