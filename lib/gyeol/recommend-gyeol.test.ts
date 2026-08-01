import { describe, expect, it } from 'vitest'
import { recommendByGyeol } from './recommend-gyeol'
import { makeGyeol } from './gyeol.fixture'
import type { Catalog, CatalogEntry } from './types'

const VOCAB = ['zombie', 'apocalypse', 'survival', 'romance']
const IDF = [2, 3, 1, 5]

/** 카탈로그 순서가 곧 인지도 순이다(vote_count 내림차순). */
const work = (i: number, k: number[], g: number[] = [], ko: 0 | 1 = 0): CatalogEntry => ({
  i,
  m: 0,
  t: `작품${i}`,
  y: 2020,
  p: `${i}.jpg`,
  g,
  k,
  ko,
})

const catalog = (works: CatalogEntry[]): Catalog => ({ vocabulary: VOCAB, idf: IDF, works })

const SURVIVOR = makeGyeol({
  id: 'survivor',
  name: '끝까지 남는 결',
  keywords: ['zombie', 'apocalypse', 'survival'],
  genres: [],
})

describe('recommendByGyeol', () => {
  it('결의 조건 키워드를 가진 작품만 낸다', () => {
    const works = [work(1, [0]), work(2, [3]), work(3, [1])]
    const result = recommendByGyeol(SURVIVOR, catalog(works), [], 10)
    expect(result.map((w) => w.i).sort()).toEqual([1, 3])
  })

  it('이미 고른 작품은 빼놓는다', () => {
    const 고른것 = work(1, [0])
    const works = [고른것, work(2, [0])]
    const result = recommendByGyeol(SURVIVOR, catalog(works), [고른것], 10)
    expect(result.map((w) => w.i)).toEqual([2])
  })

  it('한 키워드에 쏠리지 않고 키워드를 돌아가며 뽑는다', () => {
    // zombie(0)에 인지도 높은 작품이 몰려 있다. 점수 순으로만 뽑으면 결과가
    // 전부 좀비물이 된다 — 사용자가 지적한 "다 비슷한 것만 나온다"가 이것이다.
    const works = [
      work(1, [0]), work(2, [0]), work(3, [0]), work(4, [0]),
      work(10, [1]),
      work(20, [2]),
    ]
    const result = recommendByGyeol(SURVIVOR, catalog(works), [], 4)
    const ids = result.map((w) => w.i)
    expect(ids).toContain(10)
    expect(ids).toContain(20)
    // 좀비물이 넷을 다 먹지 않는다
    expect(ids.filter((id) => id < 10).length).toBeLessThanOrEqual(2)
  })

  it('버킷 안에서는 인지도(카탈로그 순서)를 지킨다', () => {
    const works = [work(1, [0]), work(2, [0]), work(3, [0])]
    const result = recommendByGyeol(SURVIVOR, catalog(works), [], 3)
    expect(result.map((w) => w.i)).toEqual([1, 2, 3])
  })

  it('고른 작품이 많이 걸린 키워드를 먼저 낸다', () => {
    // 같은 결이라도 좀비를 고른 사람과 종말물을 고른 사람의 첫 추천이 달라야
    // 한다. 결 단위로만 뽑으면 같은 결을 받은 모두가 같은 목록을 본다.
    const works = [work(1, [0]), work(10, [1])]
    const 좀비팬 = recommendByGyeol(SURVIVOR, catalog(works), [work(99, [0])], 2)
    const 종말팬 = recommendByGyeol(SURVIVOR, catalog(works), [work(98, [1])], 2)
    expect(좀비팬[0].i).toBe(1)
    expect(종말팬[0].i).toBe(10)
  })

  it('한국 작품이 목록을 독식하지 않는다', () => {
    // 카탈로그 순서는 전역 인지도 순이 아니라 한국/해외 그룹별로 정렬돼 있다.
    // 전체의 7.8%만 한국인데 조건 키워드 후보 상위 50편은 거의 전부 한국이라,
    // 앞에서부터 뽑으면 한국 작품만 나온다.
    const works = [
      work(1, [0], [], 1), work(2, [0], [], 1), work(3, [0], [], 1), work(4, [0], [], 1),
      work(50, [0], [], 0), work(51, [0], [], 0),
    ]
    const result = recommendByGyeol(SURVIVOR, catalog(works), [], 4)
    const 한국 = result.filter((w) => w.ko === 1).length
    expect(한국).toBe(2)
    expect(result.filter((w) => w.ko === 0).length).toBe(2)
  })

  it('한쪽이 모자라면 남은 쪽으로 채운다', () => {
    // 해외 후보가 하나뿐이라고 빈자리를 남기면 안 된다.
    const works = [work(1, [0], [], 1), work(2, [0], [], 1), work(50, [0], [], 0)]
    const result = recommendByGyeol(SURVIVOR, catalog(works), [], 3)
    expect(result).toHaveLength(3)
  })

  it('같은 작품을 두 번 내지 않는다', () => {
    // 한 작품이 결의 키워드 여러 개를 동시에 가질 수 있다.
    const works = [work(1, [0, 1, 2]), work(2, [0])]
    const result = recommendByGyeol(SURVIVOR, catalog(works), [], 10)
    expect(result.map((w) => w.i)).toEqual([1, 2])
  })

  it('후보가 모자라면 있는 만큼만 낸다', () => {
    expect(recommendByGyeol(SURVIVOR, catalog([work(1, [0])]), [], 10)).toHaveLength(1)
  })

  it('어휘에 없는 키워드가 있어도 던지지 않는다', () => {
    const gyeol = makeGyeol({ id: 'x', keywords: ['zombie', '없는키워드'], genres: [] })
    expect(() => recommendByGyeol(gyeol, catalog([work(1, [0])]), [], 5)).not.toThrow()
  })

  it('걸리는 작품이 없으면 빈 배열을 낸다', () => {
    expect(recommendByGyeol(SURVIVOR, catalog([work(1, [3])]), [], 5)).toEqual([])
  })
})
