export interface Rng {
  next: () => number
}

export function createRng(seed = Date.now()): Rng {
  let value = seed % 2147483647
  if (value <= 0) value += 2147483646
  return {
    next: () => {
      value = (value * 16807) % 2147483647
      return (value - 1) / 2147483646
    },
  }
}

export const randomRng: Rng = {
  next: () => Math.random(),
}

export function pickOne<T>(items: T[], rng: Rng) {
  return items[Math.floor(rng.next() * items.length)]
}

export function rollInt(min: number, max: number, rng: Rng) {
  return Math.round(min + rng.next() * (max - min))
}
