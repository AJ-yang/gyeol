import { describe, expect, it } from 'vitest'
import { searchWorks } from './grid'
import type { CatalogEntry } from './types'

function work(i: number, ko: 0 | 1, m: 0 | 1): CatalogEntry {
  return { i, m, t: `T${i}`, y: 2020, p: `${i}.jpg`, g: [], k: [], ko }
}

const WORKS: CatalogEntry[] = [
  ...Array.from({ length: 50 }, (_, n) => work(1000 + n, 1, 0)),
  ...Array.from({ length: 50 }, (_, n) => work(2000 + n, 1, 1)),
  ...Array.from({ length: 50 }, (_, n) => work(3000 + n, 0, 0)),
  ...Array.from({ length: 50 }, (_, n) => work(4000 + n, 0, 1)),
]

describe('searchWorks', () => {
  it('제목 일부로 찾는다', () => {
    const hits = searchWorks(WORKS, 'T1000', 10)
    expect(hits[0].i).toBe(1000)
  })

  it('대소문자를 가리지 않는다', () => {
    expect(searchWorks(WORKS, 't1000', 10)).toEqual(searchWorks(WORKS, 'T1000', 10))
  })

  it('빈 질의에 빈 배열을 낸다', () => {
    expect(searchWorks(WORKS, '   ', 10)).toEqual([])
  })

  it('개수를 제한한다', () => {
    expect(searchWorks(WORKS, 'T', 5)).toHaveLength(5)
  })

  it('인지도 순서를 유지한다', () => {
    const hits = searchWorks(WORKS, 'T', 5)
    expect(hits[0].i).toBe(1000)
  })
})
