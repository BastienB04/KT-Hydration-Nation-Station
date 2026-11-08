# frog_graphic_art_theme: design workspace (not part of the app build)

Nothing here is imported by Vite, Vitest, Tauri or CI. Vite serves only `index.html` and `src/`, Vitest includes only `src/**/*.test.ts`, Tauri bundles only `../dist`. Finished SVGs are copied into `src/` or `src-tauri/icons/` in Phase 4; this folder is the source of truth for the design work.

| Folder | Contents |
|---|---|
| `basis_raw/` | Inspiration images supplied by the user. Third-party artwork (one carries a Xiaohongshu watermark, `leo_8410`). **Style reference only: never traced, copied, or shipped.** Git-ignored. |
| `style_guide/` | Measured colours, stroke weight, proportions and face rules distilled from the references. |
| `ribbit_svg/` | Original vector drawings of Ribbit in that style: base, state variations, icon and tray silhouettes. |
| `mockups/` | Rendered PNG mockups of the candidate app designs. Direction C plus a dark mode was selected on 7 Nov 2026; see `mockups/MOCKUPS.md`. |
| `scratch/` | Working files. Git-ignored. |
| `review/` | Design review reports and gate files from the design workflow. Git-ignored. |
| `implementation_screenshots/` | Final screenshots of the implemented Phase 4 app: 16 PNGs at 2x (Setup, Pond 48 %/100 %/celebrate, Week, Settings top and bottom, About; light, dark and system-dark; 360×600 and 1024×768), captured from the production build by a git-ignored harness. Committed. |
