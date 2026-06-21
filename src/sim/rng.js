// Tiny seeded PRNG (mulberry32). Deterministic given a seed, so loot rolls are
// reproducible in tests. Not for anything security/economy-critical.

export function makeRng(seed = Date.now() >>> 0) {
  let a = seed >>> 0;
  const rng = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  rng.int = (min, max) => min + Math.floor(rng() * (max - min + 1)); // inclusive
  rng.range = (min, max) => min + rng() * (max - min);
  rng.pick = (arr) => arr[Math.floor(rng() * arr.length)];
  return rng;
}
