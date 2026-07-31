// lib/gyeol/sections.test.ts
import { describe, expect, it } from 'vitest'
import { GENRE_INDEX } from './genres'
import { buildSections, SECTION_DEFS } from './sections'
import { workKey, type CatalogEntry } from './types'

function work(i: number, ko: 0 | 1, m: 0 | 1, g: number[]): CatalogEntry {
  return { i, m, t: `T${i}`, y: 2020, p: `${i}.jpg`, g, k: [], ko }
}

/** 모든 섹션이 채워지도록 장르마다 네 분면을 넉넉히 만든다. */
const WORKS: CatalogEntry[] = SECTION_DEFS.flatMap((def, s) =>
  ([[1, 0], [1, 1], [0, 0], [0, 1]] as [0 | 1, 0 | 1][]).flatMap(([ko, m]) =>
    Array.from({ length: 8 }, (_, n) => work(s * 100 + (ko * 2 + m) * 10 + n, ko, m, [
      GENRE_INDEX[def.genres[0]],
    ])),
  ),
)

describe('buildSections', () => {
  it('정의된 섹션을 모두 낸다', () => {
    expect(buildSections(WORKS)).toHaveLength(SECTION_DEFS.length)
  })

  it('섹션마다 요청한 수만큼 채운다', () => {
    for (const section of buildSections(WORKS)) {
      expect(section.works.length, section.name).toBe(6)
    }
  })

  it('같은 작품이 두 섹션에 나오지 않는다', () => {
    // 기생충은 범죄와 코미디 양쪽에 걸린다. 한 화면에 두 번 나오면 이상하다.
    const all = buildSections(WORKS).flatMap((s) => s.works.map(workKey))
    expect(new Set(all).size).toBe(all.length)
  })

  it('섹션 안에서 한국 작품과 드라마가 섞인다', () => {
    // 영화가 인지도 상위를 독점하면 K-드라마 팬이 고를 것이 없어진다
    for (const section of buildSections(WORKS)) {
      expect(section.works.some((w) => w.ko === 1), `${section.name} 한국`).toBe(true)
      expect(section.works.some((w) => w.m === 1), `${section.name} 드라마`).toBe(true)
    }
  })

  it('같은 입력에 같은 결과를 낸다', () => {
    expect(buildSections(WORKS)).toEqual(buildSections(WORKS))
  })

  it('작품이 부족한 섹션은 있는 만큼만 낸다', () => {
    const thin = WORKS.slice(0, 3)
    for (const section of buildSections(thin)) {
      expect(section.works.length).toBeLessThanOrEqual(6)
    }
  })

  it('드라마 장르를 섹션 기준으로 쓰지 않는다', () => {
    // 작품의 60.7%에 붙어 있어 섹션이 뭉개진다
    for (const def of SECTION_DEFS) expect(def.genres, def.name).not.toContain('드라마')
  })
})
