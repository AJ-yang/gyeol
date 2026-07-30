import Anthropic from '@anthropic-ai/sdk'
import { writeFileSync } from 'node:fs'
import { checkPool } from '../lib/pool-health'
import type { Axes, Work } from '../lib/types'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TARGET_SIZE = 240
const BATCH_SIZE = 20
/** 한국 사용자가 제목을 보고 아는 작품이어야 선택이 성립하므로 한국 작품 하한을 둔다. */
const MIN_KOREAN_RATIO = 0.3

type Candidate = Pick<Work, 'id' | 'media' | 'title' | 'year' | 'poster'> & { korean: boolean }

const LABEL_SCHEMA = {
  type: 'object',
  properties: {
    labels: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          world: { type: 'integer', enum: [-2, -1, 0, 1, 2] },
          answer: { type: 'integer', enum: [-2, -1, 0, 1, 2] },
          company: { type: 'integer', enum: [-2, -1, 0, 1, 2] },
          gain: { type: 'integer', enum: [-2, -1, 0, 1, 2] },
        },
        required: ['id', 'world', 'answer', 'company', 'gain'],
        additionalProperties: false,
      },
    },
  },
  required: ['labels'],
  additionalProperties: false,
} as const

const LABEL_INSTRUCTIONS = `각 작품을 네 개의 서사 축에 대해 -2에서 +2 사이의 정수로 평가한다.
작품이 실제로 취하는 주제적 입장을 기준으로 하고, 확신이 없으면 0을 준다.

world:   -2 세계를 바꾸는 이야기 ... +2 세계를 견디는 이야기
answer:  -2 답을 찾아내는 이야기 ... +2 질문 속에 사는 이야기
company: -2 함께 가는 이야기 ... +2 혼자 가는 이야기
gain:    -2 이겨서 얻는 이야기 ... +2 잃으며 깨닫는 이야기

모르는 작품이면 네 축 모두 0을 준다. 입력에 있는 모든 작품에 대해 하나씩 반환한다.`

async function tmdb(path: string, params: Record<string, string>): Promise<any> {
  const url = new URL(`https://api.themoviedb.org/3${path}`)
  url.searchParams.set('api_key', TMDB_API_KEY!)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const response = await fetch(url)
  if (!response.ok) throw new Error(`TMDB ${path} ${response.status}: ${await response.text()}`)
  return response.json()
}

async function discover(
  media: 'movie' | 'tv',
  extra: Record<string, string>,
  pages: number,
  korean: boolean,
): Promise<Candidate[]> {
  const out: Candidate[] = []
  for (let page = 1; page <= pages; page++) {
    const data = await tmdb(`/discover/${media}`, {
      language: 'ko-KR',
      sort_by: 'popularity.desc',
      'vote_count.gte': korean ? '200' : '1000',
      page: String(page),
      ...extra,
    })
    for (const item of data.results ?? []) {
      const title = media === 'movie' ? item.title : item.name
      const date = media === 'movie' ? item.release_date : item.first_air_date
      if (!title || !item.poster_path || !date) continue
      out.push({ id: item.id, media, title, year: Number(date.slice(0, 4)), poster: item.poster_path, korean })
    }
  }
  return out
}

async function collectCandidates(): Promise<Candidate[]> {
  const groups = await Promise.all([
    discover('movie', {}, 7, false),
    discover('tv', {}, 5, false),
    discover('movie', { with_original_language: 'ko' }, 5, true),
    discover('tv', { with_original_language: 'ko' }, 4, true),
  ])

  // 한국 작품 그룹을 먼저 넣어, 양쪽에 걸리는 작품이 korean으로 표시되게 한다.
  const byKey = new Map<string, Candidate>()
  for (const group of [groups[2], groups[3], groups[0], groups[1]]) {
    for (const item of group) {
      if (!byKey.has(`${item.media}:${item.id}`)) byKey.set(`${item.media}:${item.id}`, item)
    }
  }
  return [...byKey.values()]
}

/**
 * 축 극단에 있는 작품을 우선 남기되, 한국 작품 비중이 하한 아래로 떨어지지 않게 층화 추출한다.
 * 극단성만으로 자르면 한국 작품이 통째로 밀려날 수 있다.
 */
function selectPool(works: Work[], korean: Set<string>): Work[] {
  const byExtremity = (a: Work, b: Work) => extremity(b) - extremity(a)
  const key = (w: Work) => `${w.media}:${w.id}`

  const koreanWorks = works.filter((w) => korean.has(key(w))).sort(byExtremity)
  const restWorks = works.filter((w) => !korean.has(key(w))).sort(byExtremity)

  const koreanQuota = Math.min(koreanWorks.length, Math.ceil(TARGET_SIZE * MIN_KOREAN_RATIO))
  const picked = [...koreanWorks.slice(0, koreanQuota)]
  const remaining = [...koreanWorks.slice(koreanQuota), ...restWorks].sort(byExtremity)
  picked.push(...remaining.slice(0, TARGET_SIZE - picked.length))

  return picked.sort(byExtremity)
}

async function label(client: Anthropic, batch: Candidate[]): Promise<Map<number, Axes>> {
  const listing = batch.map((c) => `${c.id}\t${c.title} (${c.year}, ${c.media})`).join('\n')

  const response = await client.messages.create({
    model: 'claude-opus-5',
    max_tokens: 16000,
    system: LABEL_INSTRUCTIONS,
    output_config: { format: { type: 'json_schema', schema: LABEL_SCHEMA } },
    messages: [{ role: 'user', content: listing }],
  })

  if (response.stop_reason === 'refusal') throw new Error('labeling refused')

  const text = response.content.find((b) => b.type === 'text')
  if (!text || text.type !== 'text') throw new Error('no text block in labeling response')

  const parsed = JSON.parse(text.text) as {
    labels: { id: number; world: number; answer: number; company: number; gain: number }[]
  }
  const map = new Map<number, Axes>()
  for (const row of parsed.labels) {
    map.set(row.id, [row.world, row.answer, row.company, row.gain])
  }
  return map
}

async function main() {
  if (!TMDB_API_KEY) throw new Error('TMDB_API_KEY not set')

  const candidates = await collectCandidates()
  console.log(`후보 ${candidates.length}개 수집`)

  const client = new Anthropic()
  const labeledAt = new Date().toISOString().slice(0, 10)
  const works: Work[] = []
  const korean = new Set<string>()

  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE)
    const labels = await label(client, batch)
    for (const candidate of batch) {
      const axes = labels.get(candidate.id)
      if (!axes) continue
      // 네 축이 모두 0이면 모델이 모르는 작품이다. 선택기에 쓸모가 없으니 버린다.
      if (axes.every((v) => v === 0)) continue
      const { korean: isKorean, ...fields } = candidate
      if (isKorean) korean.add(`${candidate.media}:${candidate.id}`)
      works.push({ ...fields, axes, labeledAt })
    }
    console.log(`라벨링 ${Math.min(i + BATCH_SIZE, candidates.length)}/${candidates.length} → 누적 ${works.length}개`)
  }

  const pool = selectPool(works, korean)
  const koreanCount = pool.filter((w) => korean.has(`${w.media}:${w.id}`)).length

  const issues = checkPool(pool)
  if (koreanCount / pool.length < MIN_KOREAN_RATIO) {
    issues.push({
      kind: 'thin-korean',
      detail: `한국 작품 ${koreanCount}/${pool.length}. 최소 ${Math.round(MIN_KOREAN_RATIO * 100)}%가 필요하다. collectCandidates의 한국 작품 페이지 수를 늘려라.`,
    })
  }

  if (issues.length > 0) {
    console.error('\n풀 검증 실패:')
    for (const issue of issues) console.error(`  [${issue.kind}] ${issue.detail}`)
    process.exit(1)
  }

  writeFileSync('data/works.json', JSON.stringify(pool, null, 2) + '\n')
  console.log(`\ndata/works.json 작성 완료 — ${pool.length}개 (한국 작품 ${koreanCount}개)`)
}

function extremity(work: Work): number {
  return work.axes.reduce((sum, v) => sum + Math.abs(v), 0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
