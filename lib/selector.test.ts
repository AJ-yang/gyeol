import { describe, expect, it } from 'vitest'
import { makeTestPool } from './__fixtures__/pool'
import { nextPair } from './selector'
import { ROUNDS, type Choice } from './types'

const pool = makeTestPool()

/** 시드를 주고 12라운드를 끝까지 돌린다. 매 라운드 왼쪽을 고른다. */
function playThrough(seed: number) {
  const choices: Choice[] = []
  const pairs = []
  for (let i = 0; i < ROUNDS; i++) {
    const pair = nextPair(pool, choices, seed)
    pairs.push(pair)
    choices.push({ winner: pair.left, loser: pair.right })
  }
  return { choices, pairs }
}

describe('nextPair', () => {
  it('같은 작품을 두 번 내보내지 않는다', () => {
    const { pairs } = playThrough(11)
    const seen = pairs.flatMap((p) => [p.left, p.right])
    expect(new Set(seen).size).toBe(ROUNDS * 2)
  })

  it('반환하는 모든 쌍이 목표 축에서 3 이상 벌어진다', () => {
    const { pairs } = playThrough(11)
    for (const pair of pairs) {
      const gap = Math.abs(pool[pair.left].axes[pair.axis] - pool[pair.right].axes[pair.axis])
      expect(gap).toBeGreaterThanOrEqual(3)
    }
  })

  it('목표 축을 제외한 나머지 축의 차이 합이 2 이하다', () => {
    const { pairs } = playThrough(11)
    for (const pair of pairs) {
      let confound = 0
      for (let a = 0; a < 4; a++) {
        if (a === pair.axis) continue
        confound += Math.abs(pool[pair.left].axes[a] - pool[pair.right].axes[a])
      }
      expect(confound).toBeLessThanOrEqual(2)
    }
  })

  it('12라운드 후 네 축 모두 정보가 쌓인다', () => {
    const { choices } = playThrough(11)
    const info = [0, 0, 0, 0]
    for (const c of choices) {
      for (let a = 0; a < 4; a++) {
        info[a] += Math.abs(pool[c.winner].axes[a] - pool[c.loser].axes[a])
      }
    }
    for (const value of info) expect(value).toBeGreaterThan(0)
  })

  it('같은 시드는 같은 대진을 낸다', () => {
    expect(playThrough(5).pairs).toEqual(playThrough(5).pairs)
  })

  it('다른 시드는 다른 첫 문항을 낸다', () => {
    const first = new Set([1, 2, 3, 4, 5, 6, 7, 8].map((s) => JSON.stringify(nextPair(pool, [], s))))
    expect(first.size).toBeGreaterThan(1)
  })
})
