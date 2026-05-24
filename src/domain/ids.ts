let counter = 0

export function createId(prefix = 'id') {
  counter += 1
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}_${globalThis.crypto.randomUUID()}`
  }
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}`
}
