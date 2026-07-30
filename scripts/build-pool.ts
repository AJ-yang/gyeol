import { readFileSync, writeFileSync } from 'node:fs'
import { checkPool } from '../lib/pool-health'
import type { Axes, Work } from '../lib/types'
import type { Candidate } from './fetch-candidates'

/**
 * data/candidates.json(TMDB 수집)과 data/labels.json(축 라벨)을 합쳐 data/works.json을 만든다.
 *
 * labels.json은 `"movie:550": [-1, 2, 1, 2]` 형태로 `media:id`를 축 배열에 매핑한다.
 * 축 순서는 [세계, 답, 동행, 획득] = lib/types.ts의 AXIS_LETTERS 순서와 같다.
 */

const TARGET_SIZE = 240
/** 한국 사용자가 제목을 보고 아는 작품이어야 선택이 성립하므로 한국 작품 하한을 둔다. */
const MIN_KOREAN_RATIO = 0.3

type Labels = Record<string, Axes>

function keyOf(item: { media: string; id: number }): string {
  return `${item.media}:${item.id}`
}

function extremity(work: Work): number {
  return work.axes.reduce((sum, v) => sum + Math.abs(v), 0)
}

/**
 * 축 극단에 있는 작품을 우선 남기되, 한국 작품 비중이 하한 아래로 떨어지지 않게 층화 추출한다.
 * 극단성만으로 자르면 한국 작품이 통째로 밀려날 수 있다.
 */
function selectPool(works: Work[], korean: Set<string>): Work[] {
  const byExtremity = (a: Work, b: Work) => extremity(b) - extremity(a)

  const koreanWorks = works.filter((w) => korean.has(keyOf(w))).sort(byExtremity)
  const restWorks = works.filter((w) => !korean.has(keyOf(w))).sort(byExtremity)

  const koreanQuota = Math.min(koreanWorks.length, Math.ceil(TARGET_SIZE * MIN_KOREAN_RATIO))
  const picked = [...koreanWorks.slice(0, koreanQuota)]
  const remaining = [...koreanWorks.slice(koreanQuota), ...restWorks].sort(byExtremity)
  picked.push(...remaining.slice(0, TARGET_SIZE - picked.length))

  return picked.sort(byExtremity)
}

function validateLabel(key: string, axes: unknown): Axes {
  if (!Array.isArray(axes) || axes.length !== 4) {
    throw new Error(`labels.json: ${key}의 축이 4개가 아니다 — ${JSON.stringify(axes)}`)
  }
  for (const value of axes) {
    if (!Number.isInteger(value) || value < -2 || value > 2) {
      throw new Error(`labels.json: ${key}에 -2..2 정수가 아닌 값 ${JSON.stringify(value)}`)
    }
  }
  return axes as Axes
}

function main() {
  const candidates = JSON.parse(readFileSync('data/candidates.json', 'utf8')) as Candidate[]
  const labels = JSON.parse(readFileSync('data/labels.json', 'utf8')) as Labels

  const labeledAt = new Date().toISOString().slice(0, 10)
  const works: Work[] = []
  const korean = new Set<string>()
  const unlabeled: string[] = []

  for (const candidate of candidates) {
    const key = keyOf(candidate)
    const raw = labels[key]
    if (!raw) {
      unlabeled.push(`${key}\t${candidate.title}`)
      continue
    }

    const axes = validateLabel(key, raw)
    // 네 축이 모두 0이면 판단을 보류한 작품이다. 선택기에 쓸모가 없으니 버린다.
    if (axes.every((v) => v === 0)) continue

    const { korean: isKorean, ...fields } = candidate
    if (isKorean) korean.add(key)
    works.push({ ...fields, axes, labeledAt })
  }

  if (unlabeled.length > 0) {
    console.warn(`라벨 없는 후보 ${unlabeled.length}개 (건너뜀):`)
    for (const line of unlabeled.slice(0, 10)) console.warn(`  ${line}`)
    if (unlabeled.length > 10) console.warn(`  ... 외 ${unlabeled.length - 10}개`)
    console.warn('')
  }

  const pool = selectPool(works, korean)
  const koreanCount = pool.filter((w) => korean.has(keyOf(w))).length

  const issues = checkPool(pool)
  if (pool.length < TARGET_SIZE) {
    issues.push({
      kind: 'pool-too-small',
      detail: `${pool.length}개뿐이다. ${TARGET_SIZE}개가 필요하다. 라벨을 더 채우거나 후보를 더 모아라.`,
    })
  }
  if (koreanCount / pool.length < MIN_KOREAN_RATIO) {
    issues.push({
      kind: 'thin-korean',
      detail: `한국 작품 ${koreanCount}/${pool.length}. 최소 ${Math.round(MIN_KOREAN_RATIO * 100)}%가 필요하다.`,
    })
  }

  if (issues.length > 0) {
    console.error('풀 검증 실패:')
    for (const issue of issues) console.error(`  [${issue.kind}] ${issue.detail}`)
    process.exit(1)
  }

  writeFileSync('data/works.json', JSON.stringify(pool, null, 2) + '\n')
  console.log(`data/works.json 작성 완료 — ${pool.length}개 (한국 작품 ${koreanCount}개)`)
}

main()
