import { MAX_POOL_SIZE, type Work } from './types'

export type PoolIssue = { kind: string; detail: string }

const MIN_PER_EXTREME = 40
const MIN_ISOLATED_PAIRS = 200
const ISOLATION_MIN_GAP = 3
const ISOLATION_MAX_CONFOUND = 2

export function checkPool(pool: Work[]): PoolIssue[] {
  const issues: PoolIssue[] = []

  if (pool.length > MAX_POOL_SIZE) {
    issues.push({
      kind: 'pool-too-large',
      detail: `풀이 ${pool.length}개다. 페이로드가 인덱스를 1바이트로 담으므로 ${MAX_POOL_SIZE}개 미만이어야 한다.`,
    })
  }

  const seen = new Set<string>()
  for (const work of pool) {
    const key = `${work.media}:${work.id}`
    if (seen.has(key)) issues.push({ kind: 'duplicate', detail: `중복 작품 ${key}` })
    seen.add(key)
    if (!work.poster) issues.push({ kind: 'missing-poster', detail: `포스터 없음 ${key} (${work.title})` })
  }

  for (let axis = 0; axis < 4; axis++) {
    const negative = pool.filter((w) => w.axes[axis] <= -1).length
    const positive = pool.filter((w) => w.axes[axis] >= 1).length
    if (negative < MIN_PER_EXTREME) {
      issues.push({ kind: 'thin-extreme', detail: `축 ${axis} 음수 방향 ${negative}개 (최소 ${MIN_PER_EXTREME})` })
    }
    if (positive < MIN_PER_EXTREME) {
      issues.push({ kind: 'thin-extreme', detail: `축 ${axis} 양수 방향 ${positive}개 (최소 ${MIN_PER_EXTREME})` })
    }

    const isolated = countIsolatedPairs(pool, axis)
    if (isolated < MIN_ISOLATED_PAIRS) {
      issues.push({
        kind: 'few-isolated-pairs',
        detail: `축 ${axis} 격리 쌍 ${isolated}개 (최소 ${MIN_ISOLATED_PAIRS}). 선택기가 confound 높은 쌍을 내보내기 시작한다.`,
      })
    }
  }

  return issues
}

function countIsolatedPairs(pool: Work[], axis: number): number {
  let count = 0
  for (let i = 0; i < pool.length; i++) {
    const x = pool[i].axes
    for (let j = i + 1; j < pool.length; j++) {
      const y = pool[j].axes
      if (Math.abs(x[axis] - y[axis]) < ISOLATION_MIN_GAP) continue
      let confound = 0
      for (let a = 0; a < 4; a++) {
        if (a !== axis) confound += Math.abs(x[a] - y[a])
      }
      if (confound <= ISOLATION_MAX_CONFOUND) count++
    }
  }
  return count
}
