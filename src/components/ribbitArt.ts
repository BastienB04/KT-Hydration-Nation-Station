/**
 * Build-time SVG strings for Ribbit, props, nav glyphs and icons, plus the
 * pure string helpers that prepare them for inlining.
 *
 * The files are repo-owned constants in src/assets (see PROVENANCE.md),
 * imported raw so CSS can reach their parts (.eyes blink, .float hidden in
 * peeks, the dark sticker edge). ribbitArt.test.ts guards their hygiene, which
 * is what makes inlining them with dangerouslySetInnerHTML safe.
 */
import type { RibbitPose } from "../core/mood";

type RawMap = Record<string, string>;

const RIBBIT_FILES = import.meta.glob<string>("../assets/ribbit/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
});
const PROP_FILES = import.meta.glob<string>("../assets/props/*.svg", { query: "?raw", import: "default", eager: true });
const NAV_FILES = import.meta.glob<string>("../assets/nav/*.svg", { query: "?raw", import: "default", eager: true });
const ICON_FILES = import.meta.glob<string>("../assets/icons/*.svg", { query: "?raw", import: "default", eager: true });

/** Key a glob result by file name without folder or extension. */
function byName(files: RawMap): RawMap {
  const out: RawMap = {};
  for (const [path, svg] of Object.entries(files)) {
    out[path.slice(path.lastIndexOf("/") + 1, -".svg".length)] = svg;
  }
  return out;
}

export const RIBBIT_SVGS: RawMap = byName(RIBBIT_FILES);
export const PROP_SVGS: RawMap = byName(PROP_FILES);
export const NAV_SVGS: RawMap = byName(NAV_FILES);
export const ICON_SVGS: RawMap = byName(ICON_FILES);

export const RIBBIT_POSES: readonly RibbitPose[] = [
  "base",
  "parched",
  "waking",
  "content",
  "happy",
  "hydrated",
  "sleeping",
  "reminder",
  "wave",
  "celebrate",
];
export const NAV_NAMES = ["pond", "week", "settings", "about"] as const;
export const PROP_NAMES = ["water-drop", "sparkle", "lily-pad", "lily-pad-flower", "heart"] as const;
export const ICON_NAMES = ["bell", "check", "undo", "pencil", "x", "chev", "plus", "minus"] as const;

export type NavName = (typeof NAV_NAMES)[number];
export type PropName = (typeof PROP_NAMES)[number];
export type IconName = (typeof ICON_NAMES)[number];

/**
 * Sticker-edge stroke per art box (STYLE_GUIDE rule 11: ink width plus twice
 * an edge of 4.5 % of the character width). 512 box: 17 + 2 × 12 = 41;
 * 128 props: 8 + 2 × 5 = 18; 32 nav glyphs: about 5.
 */
const EDGE_BY_BOX: Record<string, number> = { "512": 41, "128": 18, "32": 5 };

/** Remove <title> elements (the host element carries the accessible name). */
export function stripTitle(svg: string): string {
  return svg.replace(/<title>[\s\S]*?<\/title>/g, "");
}

/** Split an SVG into its opening tag, inner markup and closing tag. */
function splitSvg(svg: string): { open: string; inner: string; close: string } {
  const start = svg.indexOf("<svg");
  const openEnd = svg.indexOf(">", start) + 1;
  const closeStart = svg.lastIndexOf("</svg>");
  if (start < 0 || openEnd <= 0 || closeStart < openEnd) throw new Error("not an <svg> document");
  return { open: svg.slice(start, openEnd), inner: svg.slice(openEnd, closeStart), close: "</svg>" };
}

/**
 * Set the root viewBox (replacing any existing one) and drop the root width
 * and height so CSS sizes the art. Inner elements are untouched.
 */
export function withViewBox(svg: string, box: string): string {
  const { open, inner, close } = splitSvg(svg);
  const tag = open
    .replace(/\s(?:width|height|viewBox)="[^"]*"/g, "")
    .replace(/^<svg/, `<svg viewBox="${box}"`);
  return tag + inner + close;
}

/**
 * Prepend a copy of the inner art inside <g class="sticker-edge">. ribbit.css
 * paints that copy as a thick --sticker-edge silhouette behind the artwork
 * (transparent in light theme, pale in dark).
 */
export function withStickerEdge(svg: string, strokeWidth: number): string {
  const { open, inner, close } = splitSvg(svg);
  return `${open}<g class="sticker-edge" stroke-width="${strokeWidth}">${inner}</g>${inner}${close}`;
}

function rootViewBox(svg: string): string {
  return /<svg[^>]*\sviewBox="([^"]*)"/.exec(svg)?.[1] ?? "0 0 512 512";
}

function edgeWidthFor(svg: string): number {
  const size = rootViewBox(svg).split(/\s+/)[2] ?? "512";
  return EDGE_BY_BOX[size] ?? 41;
}

/** Root viewBox of each Ribbit variant (512 box; body spans x 131-380, y 178-418). */
export const RIBBIT_VIEWBOX = {
  full: "0 0 512 512",
  /* Cut at chest height, just below the mouth: the card edge sits at y 366. */
  peek: "100 96 312 270",
  thumb: "96 120 320 320",
} as const;

export type RibbitVariant = keyof typeof RIBBIT_VIEWBOX;

const cache = new Map<string, string>();

function memo(key: string, build: () => string): string {
  let hit = cache.get(key);
  if (hit === undefined) {
    hit = build();
    cache.set(key, hit);
  }
  return hit;
}

/** Inline-ready Ribbit markup for a pose and variant, with the sticker edge. */
export function ribbitMarkup(pose: RibbitPose, variant: RibbitVariant): string {
  return memo(`ribbit:${pose}:${variant}`, () => {
    const raw = RIBBIT_SVGS[`ribbit-${pose}`] ?? RIBBIT_SVGS["ribbit-base"] ?? "";
    if (!raw) return "";
    const edged = withStickerEdge(stripTitle(raw), edgeWidthFor(raw));
    return withViewBox(edged, RIBBIT_VIEWBOX[variant]);
  });
}

/** Inline-ready markup for a nav glyph or prop (with sticker edge) or icon. */
export function glyphMarkup(kind: "nav" | "prop" | "icon", name: string): string {
  return memo(`${kind}:${name}`, () => {
    const map = kind === "nav" ? NAV_SVGS : kind === "prop" ? PROP_SVGS : ICON_SVGS;
    const raw = map[name];
    if (!raw) return "";
    const box = rootViewBox(raw);
    const clean = stripTitle(raw);
    return withViewBox(kind === "icon" ? clean : withStickerEdge(clean, edgeWidthFor(raw)), box);
  });
}
