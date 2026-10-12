import { clamp } from '@/utils/math.js';

/** Render loop. dt is in seconds and clamped so a background tab doesn't cause a huge jump. */
export class Loop {
  #raf = 0;
  #last = 0;

  constructor(tick) {
    this.tick = tick;
  }

  start() {
    this.#last = performance.now();
    const frame = (now) => {
      const dt = clamp((now - this.#last) / 1000, 0, 0.1);
      this.#last = now;
      this.tick(dt);
      this.#raf = requestAnimationFrame(frame);
    };
    this.#raf = requestAnimationFrame(frame);
  }

  stop() {
    cancelAnimationFrame(this.#raf);
  }
}
