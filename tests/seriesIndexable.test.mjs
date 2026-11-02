import { describe, expect, it } from 'vitest'
import { seriesIsIndexable } from '../scripts/lib/seriesIndexable.mjs'

describe('seriesIsIndexable', () => {
  it('accepts a synopsis plus an editor review', () => {
    expect(seriesIsIndexable({
      overview: 'אדי יורש אחוזה ומגלה אימפריית קנאביס.',
      editorReview: 'קומדיית פשע שנונה ששווה להתחיל בה.',
    })).toBe(true)
  })

  it('rejects a missing review or a placeholder synopsis', () => {
    expect(seriesIsIndexable({ overview: 'תקציר אמיתי.', editorReview: '' })).toBe(false)
    expect(seriesIsIndexable({ overview: 'תקציר אמיתי.' })).toBe(false)
    expect(seriesIsIndexable({
      overview: 'תקציר יתעדכן בקרוב.',
      editorReview: 'יש ביקורת, אבל אין עדיין תקציר.',
    })).toBe(false)
  })

  it('rejects empty input', () => {
    expect(seriesIsIndexable(null)).toBe(false)
    expect(seriesIsIndexable({ overview: '   ', editorReview: 'ביקורת' })).toBe(false)
  })
})
