/** FIFO queue. Add level/rating buckets here later. */
export class Matchmaker {
  #queue = [];

  constructor(onMatch) {
    this.onMatch = onMatch;
  }

  has(userId) {
    return this.#queue.some((e) => e.userId === userId);
  }

  get size() {
    return this.#queue.length;
  }

  join(entry) {
    if (this.has(entry.userId)) return false;
    this.#queue.push(entry);
    this.#pair();
    return true;
  }

  leave(userId) {
    const before = this.#queue.length;
    this.#queue = this.#queue.filter((e) => e.userId !== userId);
    return this.#queue.length < before;
  }

  #pair() {
    while (this.#queue.length >= 2) {
      const a = this.#queue.shift();
      const b = this.#queue.shift();
      this.onMatch(a, b);
    }
  }
}
