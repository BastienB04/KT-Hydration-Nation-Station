import { describe, expect, it } from "vitest";
import {
  ICON_NAMES,
  ICON_SVGS,
  NAV_NAMES,
  NAV_SVGS,
  PROP_NAMES,
  PROP_SVGS,
  RIBBIT_POSES,
  RIBBIT_SVGS,
  RIBBIT_VIEWBOX,
  glyphMarkup,
  ribbitMarkup,
  stripTitle,
  withStickerEdge,
  withViewBox,
} from "./ribbitArt";

const ALL: [string, string][] = [
  ...Object.entries(RIBBIT_SVGS).map(([n, s]) => [`ribbit/${n}`, s] as [string, string]),
  ...Object.entries(PROP_SVGS).map(([n, s]) => [`props/${n}`, s] as [string, string]),
  ...Object.entries(NAV_SVGS).map(([n, s]) => [`nav/${n}`, s] as [string, string]),
  ...Object.entries(ICON_SVGS).map(([n, s]) => [`icons/${n}`, s] as [string, string]),
];

describe("asset inventory", () => {
  it("has all 10 Ribbit poses", () => {
    expect(Object.keys(RIBBIT_SVGS).sort()).toEqual(RIBBIT_POSES.map((p) => `ribbit-${p}`).sort());
  });

  it("has every nav glyph, prop and icon", () => {
    expect(Object.keys(NAV_SVGS).sort()).toEqual([...NAV_NAMES].sort());
    expect(Object.keys(PROP_SVGS).sort()).toEqual([...PROP_NAMES].sort());
    expect(Object.keys(ICON_SVGS).sort()).toEqual([...ICON_NAMES].sort());
  });
});

describe("asset hygiene (inlined with dangerouslySetInnerHTML)", () => {
  it.each(ALL)("%s is a small, inert SVG", (_name, svg) => {
    expect(svg.trimStart().startsWith("<svg")).toBe(true);
    expect(new TextEncoder().encode(svg).length).toBeLessThan(8 * 1024);
    expect(svg).not.toMatch(/<script/i);
    expect(svg).not.toMatch(/\son[a-z]+=/i);
    expect(svg).not.toMatch(/href/i);
    expect(svg).not.toMatch(/<image/i);
    expect(svg).not.toMatch(/<foreignObject/i);
    expect(svg).not.toMatch(/base64/i);
    expect(svg).not.toMatch(/gradient/i);
    expect(svg).not.toMatch(/\sid=/);
  });

  it("icons draw with currentColor", () => {
    for (const svg of Object.values(ICON_SVGS)) expect(svg).toContain('stroke="currentColor"');
  });
});

describe("helpers", () => {
  const sample =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" class="ribbit"><title>Ribbit</title><rect width="10" height="20" stroke-width="3"/></svg>';

  it("stripTitle removes the title only", () => {
    expect(stripTitle(sample)).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" class="ribbit"><rect width="10" height="20" stroke-width="3"/></svg>',
    );
  });

  it("withViewBox replaces the root viewBox and drops root width/height only", () => {
    expect(withViewBox(stripTitle(sample), "100 96 312 270")).toBe(
      '<svg viewBox="100 96 312 270" xmlns="http://www.w3.org/2000/svg" class="ribbit"><rect width="10" height="20" stroke-width="3"/></svg>',
    );
  });

  it("withStickerEdge prepends a stroked copy of the inner art", () => {
    const out = withStickerEdge('<svg viewBox="0 0 8 8"><path d="M0,0"/></svg>', 41);
    expect(out).toBe('<svg viewBox="0 0 8 8"><g class="sticker-edge" stroke-width="41"><path d="M0,0"/></g><path d="M0,0"/></svg>');
  });

  it("rejects input that is not an SVG", () => {
    expect(() => withViewBox("<div></div>", "0 0 1 1")).toThrow();
  });

  it("ribbitMarkup crops the peek and adds the rule-11 edge", () => {
    const peek = ribbitMarkup("content", "peek");
    expect(peek.startsWith(`<svg viewBox="${RIBBIT_VIEWBOX.peek}"`)).toBe(true);
    expect(peek).toContain('<g class="sticker-edge" stroke-width="41">');
    expect(peek).not.toContain("<title>");
    expect(peek).not.toMatch(/<svg[^>]*\swidth=/);
    expect(ribbitMarkup("content", "full")).toContain(`viewBox="${RIBBIT_VIEWBOX.full}"`);
  });

  it("glyphMarkup keeps each box, edges art and leaves icons plain", () => {
    expect(glyphMarkup("nav", "pond")).toContain('<g class="sticker-edge" stroke-width="18">');
    expect(glyphMarkup("nav", "about")).toContain('viewBox="0 0 32 32"');
    expect(glyphMarkup("nav", "about")).toContain('<g class="sticker-edge" stroke-width="5">');
    expect(glyphMarkup("icon", "bell")).not.toContain("sticker-edge");
    expect(glyphMarkup("icon", "bell")).toContain('viewBox="0 0 24 24"');
    expect(glyphMarkup("icon", "nope")).toBe("");
  });
});
