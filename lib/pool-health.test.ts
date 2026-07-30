import { describe, expect, it } from 'vitest'
import { makeTestPool } from './__fixtures__/pool'
import { checkPool } from './pool-health'
import type { Work } from './types'

describe('checkPool', () => {
  it('합성 픽스처는 아무 문제도 걸리지 않는다', () => {
    expect(checkPool(makeTestPool())).toEqual([])
  })

  it('풀이 256개를 넘으면 걸러낸다', () => {
    const big = [...makeTestPool()]
    while (big.length <= 256) big.push({ ...big[0], id: big.length + 1000 })
    expect(checkPool(big).some((i) => i.kind === 'pool-too-large')).toBe(true)
  })

  it('중복 작품을 걸러낸다', () => {
    const pool = makeTestPool()
    pool[5] = { ...pool[5], id: pool[0].id, media: pool[0].media }
    expect(checkPool(pool).some((i) => i.kind === 'duplicate')).toBe(true)
  })

  it('포스터가 비면 걸러낸다', () => {
    const pool = makeTestPool()
    pool[3] = { ...pool[3], poster: '' }
    expect(checkPool(pool).some((i) => i.kind === 'missing-poster')).toBe(true)
  })

  it('한쪽 극단이 비면 걸러낸다', () => {
    const pool: Work[] = makeTestPool().filter((w) => w.axes[0] < 1)
    expect(checkPool(pool).some((i) => i.kind === 'thin-extreme')).toBe(true)
  })

  it('축 격리 쌍이 부족하면 걸러낸다', () => {
    // 모든 작품이 네 축에서 동시에 갈리도록 만들면 confound가 커져 격리 쌍이 사라진다.
    const pool: Work[] = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      media: 'movie' as const,
      title: `W${i}`,
      year: 2000,
      poster: '/p.jpg',
      axes: (i % 2 === 0 ? [-2, -2, -2, -2] : [2, 2, 2, 2]) as Work['axes'],
      labeledAt: '2026-07-30',
    }))
    expect(checkPool(pool).some((i) => i.kind === 'few-isolated-pairs')).toBe(true)
  })
})
