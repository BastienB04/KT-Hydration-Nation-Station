/**
 * A single synthesized "ribbit" via the Web Audio API, so Phase 3 needs no
 * audio asset (a polished clip is Phase 4). The AudioContext is created lazily
 * and resumed on the first user gesture, because browsers and WebView2 block
 * autoplay until then. Any failure is a silent no-op.
 */
import type { Sound } from "./types";

type AudioContextCtor = typeof AudioContext;

export function createWebAudioSound(): Sound & { dispose(): void } {
  let ctx: AudioContext | null = null;

  const Ctor: AudioContextCtor | undefined =
    typeof AudioContext !== "undefined"
      ? AudioContext
      : (globalThis as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;

  function ensureContext(): AudioContext | null {
    if (Ctor === undefined) return null;
    if (ctx === null) {
      try {
        ctx = new Ctor();
      } catch {
        return null;
      }
    }
    return ctx;
  }

  function unlock() {
    const c = ensureContext();
    if (c && c.state === "suspended") void c.resume();
  }

  const hasDom = typeof window !== "undefined" && typeof window.addEventListener === "function";
  if (hasDom) window.addEventListener("pointerdown", unlock, { once: false });

  function blip(c: AudioContext, start: number, from: number, to: number) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(from, start);
    osc.frequency.exponentialRampToValueAtTime(to, start + 0.12);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);
    osc.connect(gain).connect(c.destination);
    osc.start(start);
    osc.stop(start + 0.15);
  }

  return {
    ribbit() {
      const c = ensureContext();
      if (!c) return;
      try {
        if (c.state === "suspended") void c.resume();
        const t = c.currentTime;
        blip(c, t, 520, 260);
        blip(c, t + 0.16, 500, 250);
      } catch {
        // Ignore: sound is best-effort.
      }
    },
    dispose() {
      if (hasDom) window.removeEventListener("pointerdown", unlock);
      if (ctx) {
        void ctx.close().catch(() => {});
        ctx = null;
      }
    },
  };
}
