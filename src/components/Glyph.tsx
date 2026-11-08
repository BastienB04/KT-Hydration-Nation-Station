/**
 * Small decorative art: nav glyphs and props (coloured, with the dark sticker
 * edge) and line icons (currentColor). Always aria-hidden: the surrounding
 * button or text carries the meaning.
 */
import { glyphMarkup, type IconName, type NavName, type PropName } from "./ribbitArt";

export type GlyphName = `nav/${NavName}` | `prop/${PropName}` | `icon/${IconName}`;

export function Glyph({ name, className }: { name: GlyphName; className?: string }) {
  const [kind, file] = name.split("/") as ["nav" | "prop" | "icon", string];
  const classes = ["glyph", `glyph--${kind}`];
  if (className) classes.push(className);
  return (
    <span
      className={classes.join(" ")}
      aria-hidden="true"
      // Repo-owned build-time SVG constants only; see ribbitArt.test.ts.
      dangerouslySetInnerHTML={{ __html: glyphMarkup(kind, file) }}
    />
  );
}
