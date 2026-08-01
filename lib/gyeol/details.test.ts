import { describe, expect, it } from 'vitest'
import { CHUNK_COUNT, detailChunk, detailChunkPath } from './details'
import type { CatalogEntry } from './types'

const work = (m: 0 | 1, i: number): CatalogEntry => ({
  i,
  m,
  t: `작품${i}`,
  y: 2020,
  p: 'a.jpg',
  g: [],
  k: [],
  ko: 0,
})

describe('detailChunk', () => {
  it('언제나 청크 범위 안에 든다', () => {
    for (const id of [0, 1, 511, 512, 999999, 1087891]) {
      const chunk = detailChunk(work(0, id))
      expect(chunk).toBeGreaterThanOrEqual(0)
      expect(chunk).toBeLessThan(CHUNK_COUNT)
    }
  })

  it('같은 작품은 항상 같은 청크로 간다', () => {
    // 빌드가 넣은 곳과 클라이언트가 찾는 곳이 어긋나면 조용히 아무것도 안 뜬다.
    expect(detailChunk(work(0, 680))).toBe(detailChunk(work(0, 680)))
  })

  it('매체가 달라도 id가 같으면 같은 청크다', () => {
    // TMDB id는 매체별로 독립이라 영화 670과 TV 670이 둘 다 존재한다. 한
    // 파일에 같이 담고 안에서 workKey로 가른다.
    expect(detailChunk(work(0, 670))).toBe(detailChunk(work(1, 670)))
  })

  it('경로는 청크 번호를 자리수 맞춰 낸다', () => {
    expect(detailChunkPath(7)).toBe('details/007.json')
    expect(detailChunkPath(511)).toBe('details/511.json')
  })
})

