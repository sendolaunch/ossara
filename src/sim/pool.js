// Object pool — design doc §14 hard requirement: reuse enemy/projectile objects
// instead of allocating and GCing every spawn. Acquire pulls a dead object (or
// makes one), release returns it. Live objects are iterated via `active`.
export class Pool {
  constructor(factory, reset) {
    this.factory = factory; // () => newObject
    this.reset = reset; // (obj, ...args) => void  (re-init for reuse)
    this.free = [];
    this.active = [];
  }

  acquire(...args) {
    const obj = this.free.pop() || this.factory();
    this.reset(obj, ...args);
    this.active.push(obj);
    return obj;
  }

  // Sweep released/dead objects out of `active` back into `free`.
  // `isDead(obj)` decides. Returns the count released this sweep.
  sweep(isDead) {
    let released = 0;
    for (let i = this.active.length - 1; i >= 0; i--) {
      const obj = this.active[i];
      if (isDead(obj)) {
        // swap-remove for O(1)
        const last = this.active.pop();
        if (i < this.active.length) this.active[i] = last;
        this.free.push(obj);
        released++;
      }
    }
    return released;
  }

  get liveCount() {
    return this.active.length;
  }

  get pooledCount() {
    return this.free.length;
  }
}
