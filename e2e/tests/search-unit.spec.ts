import { test, expect } from '@playwright/test'
// Pure, dependency-free search helpers are exercised directly (no page render).
import { searchMatches, joinSearchable } from '../../lib/utils/search'

test.describe('searchMatches unit tests', () => {
  test('returns true for an empty needle (no filter active)', () => {
    expect(searchMatches('', 'anything here')).toBe(true)
    expect(searchMatches('   ', 'anything here')).toBe(true)
  })

  test('matches a full substring case-insensitively', () => {
    expect(searchMatches('pytorch', 'PyTorch 2.2 release')).toBe(true)
    expect(searchMatches('PYTORCH', 'pytorch blog')).toBe(true)
  })

  test('requires every whitespace-separated token to appear', () => {
    expect(searchMatches('security pytorch', 'security vulnerability pytorch')).toBe(true)
    expect(searchMatches('security pytorch', 'security vulnerability only')).toBe(false)
  })

  test('tokens may appear in any order', () => {
    expect(searchMatches('langchain LCEL', 'LCEL best practices langchain')).toBe(true)
  })

  test('does not match on partial words (substring only, not fuzzy)', () => {
    // The matcher is substring-based: a full token must appear verbatim.
    expect(searchMatches('pytorch2', 'pytorch 2.2')).toBe(false)
  })

  test('returns false when needle is not found', () => {
    expect(searchMatches('missing-term', 'unrelated article')).toBe(false)
  })
})

test.describe('joinSearchable unit tests', () => {
  test('joins provided fields with spaces', () => {
    expect(joinSearchable('hello', null, 'world', undefined)).toBe('hello world')
  })

  test('returns empty string when all fields are empty/null', () => {
    expect(joinSearchable(null, undefined, '')).toBe('')
  })
})
