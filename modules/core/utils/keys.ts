export function generateKey(prefix = 'item'): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`
}
