export function splitLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

export function joinLines(lines?: string[]): string {
  return (lines || []).join('\n')
}

export function splitComma(text: string): string[] {
  return text
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function joinComma(items?: string[]): string {
  return (items || []).join(', ')
}
