export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const easeOutQuad = (t) => 1 - (1 - t) * (1 - t);
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
