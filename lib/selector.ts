import { makeRng, seededShuffle } from './rng'
import type { Choice, Work } from './types'

export type Pair = {
  left: number
  right: number
  /** 이 쌍이 겨냥하는 축. 채점에는 쓰이지 않고 테스트와 디버깅용이다. */
  axis: number
}

const MIN_GAPS = [3, 2, 0] as const

export function nextPair(pool: Work[], choices: Choice[], seed: number): Pair {
  const used = new Set<number>()
  const info = [0, 0, 0, 0]
  for (const choice of choices) {
    used.add(choice.winner)
    used.add(choice.loser)
    for (let a = 0; a < 4; a++) {
      info[a] += Math.abs(pool[choice.winner].axes[a] - pool[choice.loser].axes[a])
    }
  }

  // 동점일 때의 축 우선순위는 세션 시드로 정한다. 첫 라운드는 네 축이 모두 0이라
  // 항상 이 규칙을 타므로 세션마다 다른 축에서 시작한다. Array.sort는 안정 정렬이다.
  const axisOrder = seededShuffle([0, 1, 2, 3], makeRng(seed))
  const axesByPriority = [...axisOrder].sort((x, y) => info[x] - info[y])

  const rng = makeRng(seed + choices.length * 7919)
  const available = seededShuffle(
    pool.map((_, i) => i).filter((i) => !used.has(i)),
    rng,
  )

  for (const minGap of MIN_GAPS) {
    for (const axis of axesByPriority) {
      const best = bestPair(pool, available, axis, minGap)
      if (best) {
        const [x, y] = best
        // 좌우 배치를 무작위로 섞어 위치 편향을 없앤다.
        return rng() < 0.5 ? { left: x, right: y, axis } : { left: y, right: x, axis }
      }
    }
  }

  throw new Error('no available pair')
}

function bestPair(pool: Work[], available: number[], axis: number, minGap: number): [number, number] | null {
  let best: [number, number] | null = null
  let bestScore = -Infinity

  for (let i = 0; i < available.length; i++) {
    const x = pool[available[i]].axes
    for (let j = i + 1; j < available.length; j++) {
      const y = pool[available[j]].axes
      const gap = Math.abs(x[axis] - y[axis])
      if (gap < minGap) continue

      let confound = 0
      for (let a = 0; a < 4; a++) {
        if (a !== axis) confound += Math.abs(x[a] - y[a])
      }

      const value = 2 * gap - confound
      if (value > bestScore) {
        bestScore = value
        best = [available[i], available[j]]
      }
    }
  }

  return best
}
