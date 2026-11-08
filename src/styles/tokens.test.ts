import { describe, expect, it } from "vitest";
import tokens from "./tokens.css?raw";

const STYLES = import.meta.glob<string>("./*.css", { query: "?raw", import: "default", eager: true });

function block(css: string, selector: RegExp): string {
  const match = selector.exec(css);
  if (!match) throw new Error(`missing block ${selector}`);
  return match[1].replace(/\s+/g, " ").trim();
}

describe("tokens.css", () => {
  it("is loaded as raw text", () => {
    expect(tokens).toContain("--page");
  });

  it("keeps the explicit and the no-JS dark blocks identical", () => {
    const explicit = block(tokens, /:root\[data-theme="dark"\]\s*\{([^}]*)\}/);
    const media = /@media \(prefers-color-scheme: dark\)\s*\{\s*:root:not\(\[data-theme\]\)\s*\{([^}]*)\}/.exec(tokens);
    expect(media).not.toBeNull();
    expect(media![1].replace(/\s+/g, " ").trim()).toBe(explicit);
    expect(explicit).toContain("color-scheme: dark;");
  });

  it("declares the light scheme on :root", () => {
    expect(block(tokens, /:root\s*\{([^}]*)\}/)).toContain("color-scheme: light;");
  });

  it("defines every semantic token the components use in light and dark", () => {
    const light = block(tokens, /:root\s*\{([^}]*)\}/);
    const dark = block(tokens, /:root\[data-theme="dark"\]\s*\{([^}]*)\}/);
    for (const name of ["page", "surface", "surface-inset", "line", "text", "text-muted", "link", "focus", "pond", "water-strong", "heart", "danger", "sticker-edge"]) {
      expect(light).toContain(`--${name}:`);
      expect(dark).toContain(`--${name}:`);
    }
  });
});

describe("src/styles", () => {
  it("finds the stylesheets", () => {
    expect(Object.keys(STYLES).sort()).toEqual(
      expect.arrayContaining(["./base.css", "./components.css", "./fonts.css", "./ribbit.css", "./tokens.css"]),
    );
  });

  it.each(Object.entries(STYLES))("%s has no gradient and no blur shadow", (_path, css) => {
    expect(css).not.toMatch(/gradient/i);
    expect(css).not.toMatch(/--shadow|box-shadow/);
  });

  it("bundles the font locally", () => {
    const fonts = STYLES["./fonts.css"];
    expect(fonts).toContain('url("../assets/fonts/nunito-latin-wght.woff2")');
    expect(fonts).not.toMatch(/https?:/);
  });
});
