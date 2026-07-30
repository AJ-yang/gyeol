import { describe, expect, it } from 'vitest'
import { mustPair } from './__fixtures__/must-pair'
import { makeFilterProbePool, makeSparsePool, makeTestPool } from './__fixtures__/pool'
import { nextPair } from './selector'
import { ROUNDS, type Choice } from './types'

const pool = makeTestPool()
const SEEDS = Array.from({ length: 100 }, (_, i) => i + 1)

/** 시드를 주고 12라운드를 끝까지 돌린다. 매 라운드 왼쪽을 고른다. */
function playThrough(seed: number) {
  const choices: Choice[] = []
  const pairs = []
  for (let i = 0; i < ROUNDS; i++) {
    const pair = mustPair(pool, choices, seed)
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

  it('시드마다 첫 문항의 작품 조합이 실제로 달라진다', () => {
    // JSON.stringify로 비교하면 좌우 배치만 뒤집혀도 통과한다. 그러면 셔플이 죽어
    // 전 세션이 같은 12문항을 받는 상태를 놓친다. 작품 조합 자체를 봐야 한다.
    const questions = new Set(
      SEEDS.map((seed) => {
        const pair = mustPair(pool, [], seed)
        return [pair.left, pair.right].sort((a, b) => a - b).join(',')
      }),
    )
    expect(questions.size).toBeGreaterThan(20)
  })

  it('첫 문항의 목표 축이 시드에 따라 네 축을 모두 커버한다', () => {
    const axes = new Set(SEEDS.map((seed) => mustPair(pool, [], seed).axis))
    expect([...axes].sort()).toEqual([0, 1, 2, 3])
  })

})

describe('nextPair 축 격리 필터', () => {
  it('점수가 더 높아도 격리되지 않은 쌍은 내보내지 않는다', () => {
    // 이 풀에서 최고점 쌍(gap 2, confound 0, score 4)은 격리에 실패하고,
    // 격리된 쌍(gap 3, confound 3)은 점수가 낮다. 필터가 없으면 전자가 뽑힌다.
    const probe = makeFilterProbePool()
    const choices: Choice[] = []

    for (let i = 0; i < ROUNDS; i++) {
      const pair = mustPair(probe, choices, 11)
      const gap = Math.abs(probe[pair.left].axes[pair.axis] - probe[pair.right].axes[pair.axis])
      expect(gap).toBeGreaterThanOrEqual(3)
      choices.push({ winner: pair.left, loser: pair.right })
    }
  })
})

describe('nextPair 완화 단계', () => {
  it('gap 3 쌍이 없는 풀에서는 완화 단계로 내려가 12라운드를 끝낸다', () => {
    // 조밀한 makeTestPool은 1단계에서 항상 완벽한 쌍을 찾아 MIN_GAPS의 나머지 티어가
    // 죽은 코드로 남는다. 실제 풀은 이보다 성기므로 완화 경로가 살아 있어야 한다.
    const sparse = makeSparsePool()
    const choices: Choice[] = []

    for (let i = 0; i < ROUNDS; i++) {
      const pair = mustPair(sparse, choices, 11)
      const gap = Math.abs(sparse[pair.left].axes[pair.axis] - sparse[pair.right].axes[pair.axis])
      expect(gap).toBeGreaterThanOrEqual(2)
      choices.push({ winner: pair.left, loser: pair.right })
    }

    const seen = choices.flatMap((c) => [c.winner, c.loser])
    expect(new Set(seen).size).toBe(ROUNDS * 2)
  })

  it('12라운드를 채울 수 없는 풀은 진행 중이 아니라 즉시 실패한다', () => {
    const tooSmall = makeSparsePool().slice(0, ROUNDS * 2 - 1)
    expect(() => nextPair(tooSmall, [], 11, new Set())).toThrow(/pool too small/)
  })
})

describe('nextPair 제외 작품', () => {
  it('제외한 작품은 어느 라운드에도 나타나지 않는다', () => {
    // 기준 세션이 쓴 24개를 통째로 제외한다. 같은 시드는 같은 대진을 내므로,
    // 구현이 excluded를 무시하면 첫 라운드부터 반드시 걸린다.
    const excluded = new Set(playThrough(11).pairs.flatMap((p) => [p.left, p.right]))
    expect(excluded.size).toBe(ROUNDS * 2)

    const choices: Choice[] = []
    for (let i = 0; i < ROUNDS; i++) {
      const pair = mustPair(pool, choices, 11, excluded)
      expect(excluded.has(pair.left)).toBe(false)
      expect(excluded.has(pair.right)).toBe(false)
      choices.push({ winner: pair.left, loser: pair.right })
    }
  })

  it('후보가 마르면 throw하지 않고 null을 낸다', () => {
    // 사용자가 도달할 수 있는 상태다. throw하면 퀴즈 중간에 화면이 죽는다.
    const sparse = makeSparsePool()
    const excluded = new Set(sparse.map((_, i) => i).slice(0, sparse.length - 1))
    expect(nextPair(sparse, [], 11, excluded)).toBeNull()
  })

  it('스킵은 라운드를 소모하지 않고 12라운드를 끝낸다', () => {
    // 축 0이 음수인 작품을 "안 본 작품"으로 간주해 그것만 제외하는 사용자를 가정한다.
    const excluded = new Set<number>()
    const choices: Choice[] = []
    let skips = 0

    // excluded가 반영되지 않으면 같은 페어가 영원히 돌아온다. 가드가 없으면
    // 테스트가 실패하는 대신 매달려서 무엇이 깨졌는지 안 보인다.
    let guard = 0
    while (choices.length < ROUNDS) {
      if (guard++ > 500) throw new Error(`스킵 루프가 수렴하지 않는다 (제외 ${excluded.size}개, 라운드 ${choices.length})`)
      const pair = mustPair(pool, choices, 11, excluded)
      const unknown = [pair.left, pair.right].filter((i) => pool[i].axes[0] < 0)
      if (unknown.length > 0) {
        for (const i of unknown) excluded.add(i)
        skips++
        continue
      }
      choices.push({ winner: pair.left, loser: pair.right })
    }

    expect(skips).toBeGreaterThan(0)
    expect(choices.length).toBe(ROUNDS)
    for (const choice of choices) {
      expect(excluded.has(choice.winner)).toBe(false)
      expect(excluded.has(choice.loser)).toBe(false)
    }
  })
})
