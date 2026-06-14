// Deterministic 32-bit string hash (FNV-1a). Used to seed the Mock AI so the
// same item always produces the same output — no Math.random in generation.
export function hashString(str) {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    // 32-bit FNV prime multiply
    h = Math.imul(h, 0x01000193)
  }
  // force unsigned
  return h >>> 0
}

// A tiny seeded PRNG (mulberry32). Given the same seed it yields the same
// sequence — lets the mock derive several deterministic "random-looking"
// values (confidence, latency, bullet selection) from one item id.
export function mulberry32(seed) {
  let a = seed >>> 0
  return function next() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
