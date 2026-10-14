// Joins class names, skipping falsy values. Not a Tailwind merger: recipes
// in components/ui are written so a caller's className only adds to them.
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
