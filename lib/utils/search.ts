/**
 * Case-insensitive substring matcher used by the article search box.
 *
 * Kept as a pure, dependency-free function so it can be unit tested directly
 * without rendering the page.
 */

/**
 * Returns true if every whitespace-separated token in `needle` is contained in
 * `haystack`, case-insensitively. An empty or whitespace-only needle matches
 * everything (no filter active).
 */
export function searchMatches(needle: string, haystack: string): boolean {
  const q = needle.trim().toLowerCase()
  if (!q) return true

  const target = haystack.toLowerCase()

  return q.split(/\s+/).every((token) => token.length > 0 && target.includes(token))
}

/**
 * Joins a set of free-text fields into a single searchable haystack string.
 */
export function joinSearchable(...fields: Array<string | null | undefined>): string {
  return fields.filter(Boolean).join(' ')
}
