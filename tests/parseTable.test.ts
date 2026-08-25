import { describe, expect, it } from 'vitest'
import { parsePriceTable } from '../app/utils/parseTable'

describe('parsePriceTable', () => {
  it('reads a tab-separated table with a header', () => {
    const t = parsePriceTable('فولاد\tوبانک\n8400\t3100\n8520\t3140')
    expect(t.columns.map(c => c.name)).toEqual(['فولاد', 'وبانک'])
    expect(t.columns[0]!.prices).toEqual([8400, 8520])
    expect(t.rows).toBe(2)
  })

  it('reads a comma-separated table', () => {
    const t = parsePriceTable('a,b\n1,2\n3,4')
    expect(t.columns[1]!.prices).toEqual([2, 4])
  })

  it('skips a leading date column', () => {
    const t = parsePriceTable('تاریخ\tفولاد\n۱۴۰۴/۰۱/۰۱\t8400\n۱۴۰۴/۰۱/۰۲\t8520')
    expect(t.columns).toHaveLength(1)
    expect(t.columns[0]!.name).toBe('فولاد')
    expect(t.notes.some(n => n.includes('غیرعددی'))).toBe(true)
  })

  it('detects the market index column by name', () => {
    const t = parsePriceTable('فولاد\tشاخص کل\n8400\t2140000\n8520\t2152300')
    expect(t.marketColumn).toBe(1)
  })

  it('names columns itself when there is no header', () => {
    const t = parsePriceTable('8400\t3100\n8520\t3140')
    expect(t.columns[0]!.name).toBe('ستون ۱')
    expect(t.notes.some(n => n.includes('سرستون'))).toBe(true)
  })

  it('strips thousand separators inside cells', () => {
    const t = parsePriceTable('فولاد\n12,400\n12,650')
    expect(t.columns[0]!.prices).toEqual([12400, 12650])
  })

  it('reports an empty file instead of throwing', () => {
    expect(parsePriceTable('   ').columns).toEqual([])
  })
})
