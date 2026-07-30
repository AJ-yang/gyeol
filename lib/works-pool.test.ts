import { describe, expect, it } from 'vitest'
import worksData from '../data/works.json'
import { mustPair } from './__fixtures__/must-pair'
import { checkPool } from './pool-health'
import { score } from './scoring'
import { ROUNDS, type Choice, type Work } from './types'

/**
 * 합성 픽스처가 아니라 실제로 배포되는 data/works.json을 검증한다.
 *
 * 다른 selector 테스트는 조밀한 픽스처를 쓰기 때문에 실제 풀이 성겨져 축 격리가
 * 무너지는 상황을 잡지 못한다. 스펙 7절이 경고하는 대로 이 실패는 조용해서,
 * 풀을 갱신할 때마다 여기서 걸리지 않으면 아무도 눈치채지 못한다.
 */

const pool = worksData as Work[]
const SEEDS = Array.from({ length: 200 }, (_, i) => i + 1)

/** 시드로 결정되는 응답 패턴으로 한 세션을 끝까지 돌린다. */
function playSession(seed: number) {
  const choices: Choice[] = []
  const pairs = []
  for (let round = 0; round < ROUNDS; round++) {
    const pair = mustPair(pool, choices, seed)
    pairs.push(pair)
    const pickLeft = (seed * 31 + round * 17) % 2 === 0
    choices.push(
      pickLeft ? { winner: pair.left, loser: pair.right } : { winner: pair.right, loser: pair.left },
    )
  }
  return { choices, pairs }
}

describe('data/works.json', () => {
  it('풀 검증을 통과한다', () => {
    expect(checkPool(pool)).toEqual([])
  })

  it('페이로드가 담을 수 있는 크기를 넘지 않는다', () => {
    expect(pool.length).toBeLessThan(256)
    expect(pool.length).toBeGreaterThanOrEqual(ROUNDS * 2)
  })

  it('모든 작품이 포스터 경로를 가진다', () => {
    for (const work of pool) {
      expect(work.poster, work.title).toMatch(/^\/\S+/)
    }
  })
})

describe('실제 풀에서의 선택기', () => {
  it('모든 라운드가 목표 축에서 격리된 쌍을 내보낸다', () => {
    for (const seed of SEEDS) {
      for (const pair of playSession(seed).pairs) {
        const gap = Math.abs(pool[pair.left].axes[pair.axis] - pool[pair.right].axes[pair.axis])
        let confound = 0
        for (let a = 0; a < 4; a++) {
          if (a !== pair.axis) confound += Math.abs(pool[pair.left].axes[a] - pool[pair.right].axes[a])
        }
        expect(gap, `seed ${seed}`).toBeGreaterThanOrEqual(3)
        expect(confound, `seed ${seed}`).toBeLessThanOrEqual(2)
      }
    }
  })

  it('한 세션에서 같은 작품을 두 번 보여주지 않는다', () => {
    for (const seed of SEEDS) {
      const seen = playSession(seed).pairs.flatMap((p) => [p.left, p.right])
      expect(new Set(seen).size, `seed ${seed}`).toBe(ROUNDS * 2)
    }
  })
})

describe('실제 풀에서의 결과 분포', () => {
  it('16개 유형이 모두 도달 가능하다', () => {
    const codes = new Set(SEEDS.map((seed) => score(pool, playSession(seed).choices).code))
    expect(codes.size).toBe(16)
  })

  it('막대그래프가 한두 가지 길이로 뭉치지 않는다', () => {
    // 축마다 라운드 수와 gap이 균일하면 |norm|이 두 값만 갖게 되어 막대가 밋밋해진다.
    const lengths = new Set(
      SEEDS.flatMap((seed) => score(pool, playSession(seed).choices).norm.map((v) => Math.abs(v).toFixed(2))),
    )
    expect(lengths.size).toBeGreaterThanOrEqual(4)
  })
})
