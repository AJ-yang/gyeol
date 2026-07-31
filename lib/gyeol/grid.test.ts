// lib/gyeol/grid.test.ts
import { describe, expect, it } from 'vitest'
import { firstGrid, nextGrid, searchWorks } from './grid'
import { workKey, type CatalogEntry } from './types'

function work(i: number, ko: 0 | 1, m: 0 | 1, g: number[] = [], t = `T${i}`): CatalogEntry {
  return { i, m, t, y: 2020, p: `${i}.jpg`, g, k: [], ko }
}

/** 네 그룹이 이어 붙어 있고 각 그룹 안은 인지도 순인 색인을 흉내낸다. */
const WORKS: CatalogEntry[] = [
  ...Array.from({ length: 50 }, (_, n) => work(1000 + n, 1, 0, [n % 4])),
  ...Array.from({ length: 50 }, (_, n) => work(2000 + n, 1, 1, [n % 4])),
  ...Array.from({ length: 50 }, (_, n) => work(3000 + n, 0, 0, [n % 4])),
  ...Array.from({ length: 50 }, (_, n) => work(4000 + n, 0, 1, [n % 4])),
]

describe('firstGrid', () => {
  it('요청한 개수를 낸다', () => {
    expect(firstGrid(WORKS, 20)).toHaveLength(20)
  })

  it('네 그룹을 모두 섞는다', () => {
    // 한 그룹으로만 채우면 한국 드라마만 보는 사람이 아무것도 못 고른다
    const grid = firstGrid(WORKS, 20)
    const groups = new Set(grid.map((w) => `${w.ko}/${w.m}`))
    expect(groups.size).toBe(4)
  })

  it('각 그룹에서 앞쪽(인지도 상위)을 가져온다', () => {
    const grid = firstGrid(WORKS, 20)
    const koreanMovies = grid.filter((w) => w.ko === 1 && w.m === 0)
    // 그룹의 첫 작품이 반드시 들어 있어야 한다
    expect(koreanMovies.map((w) => w.i)).toContain(1000)
  })

  it('중복 없이 낸다', () => {
    const grid = firstGrid(WORKS, 40)
    expect(new Set(grid.map((w) => w.i)).size).toBe(grid.length)
  })

  it('같은 입력에 같은 결과를 낸다', () => {
    expect(firstGrid(WORKS, 20)).toEqual(firstGrid(WORKS, 20))
  })
})

describe('nextGrid', () => {
  it('이미 보여준 작품을 다시 내지 않는다', () => {
    const first = firstGrid(WORKS, 20)
    const shown = new Set(first.map(workKey))
    const second = nextGrid(WORKS, shown, [], 20)
    for (const w of second) expect(shown.has(workKey(w))).toBe(false)
  })

  it('id가 같아도 매체가 다르면 다른 작품으로 센다', () => {
    // 실제 카탈로그에 177건이 겹친다. id 670은 영화 올드보이이자 TV Baby Looney Tunes다.
    const twins = [work(777, 0, 0), work(777, 0, 1)]
    const shown = new Set([workKey(twins[0])])
    const out = nextGrid(twins, shown, [], 10)
    expect(out.map(workKey)).toEqual([workKey(twins[1])])
  })

  it('고른 작품의 장르 쪽으로 기운다', () => {
    // 1라운드에서 장르 0을 골랐으면 2라운드에 장르 0이 더 나와야 한다
    const picks = WORKS.filter((w) => w.g.includes(0)).slice(0, 3)
    const grid = nextGrid(WORKS, new Set(picks.map(workKey)), picks, 20)
    const withGenre0 = grid.filter((w) => w.g.includes(0)).length
    expect(withGenre0).toBeGreaterThan(grid.length / 4)
  })

  it('고른 것이 없으면 그냥 다음 인지도 구간을 낸다', () => {
    const first = firstGrid(WORKS, 20)
    const grid = nextGrid(WORKS, new Set(first.map(workKey)), [], 20)
    expect(grid).toHaveLength(20)
  })

  it('남은 작품이 부족하면 있는 만큼만 낸다', () => {
    const shown = new Set(WORKS.slice(0, 190).map(workKey))
    expect(nextGrid(WORKS, shown, [], 20).length).toBeLessThanOrEqual(10)
  })
})

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
