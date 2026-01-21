import { describe, it, expect } from 'vitest'
import { cn } from '~/lib/utils'

describe('Utils', () => {
  describe('cn (className merge)', () => {
    it('should merge class names correctly', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('should handle conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
    })

    it('should handle tailwind class conflicts', () => {
      // twMerge should resolve conflicts
      const result = cn('px-2 py-1', 'px-4')
      expect(result).toContain('px-4')
      expect(result).not.toContain('px-2')
    })

    it('should handle empty input', () => {
      expect(cn()).toBe('')
    })
  })
})
