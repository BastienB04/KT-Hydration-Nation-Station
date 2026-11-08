/**
 * Screen title with Ribbit peeking over the top-right edge of the next card.
 * The card that follows is positioned (components.css) so its thick top
 * border paints over the frog's cut-off chest, as in the C mockups.
 */
import type { ReactNode } from "react";

export function PeekHeader({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="peek-head">
      <h2 className="screen__title">{title}</h2>
      <div className="peek-head__art">{children}</div>
    </div>
  );
}
