import { writeFileSync } from 'node:fs'
import type { Work } from '../lib/types'

/**
 * TMDB에서 라벨링 후보를 모아 data/candidates.json으로 쓴다.
 *
 * 라벨링은 이 스크립트가 하지 않는다. 후보 목록을 사람(또는 대화 중인 Claude)이 읽고
 * data/labels.json을 채우면, build-pool.ts가 둘을 합쳐 최종 풀을 만든다.
 * 축 점수는 작품의 주제적 입장에 대한 판단이라 TMDB의 줄거리·장르를 넣을 필요가 없고,
 * 넣지 않으면 TMDB 약관의 AI 학습 금지 조항을 아예 건드리지 않는다.
 */

const TMDB_API_KEY = process.env.TMDB_API_KEY

export type Candidate = Pick<Work, 'id' | 'media' | 'title' | 'year' | 'poster'> & { korean: boolean }

/** discover 응답에서 실제로 쓰는 필드만 추린 형태. 매체에 따라 제목·날짜 키가 다르다. */
type DiscoverResult = {
  id: number
  poster_path: string | null
  title?: string
  name?: string
  release_date?: string
  first_air_date?: string
}

async function tmdb(path: string, params: Record<string, string>): Promise<{ results?: DiscoverResult[] }> {
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

async function main() {
  if (!TMDB_API_KEY) throw new Error('TMDB_API_KEY not set — .env.local을 확인하라')

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
      const key = `${item.media}:${item.id}`
      if (!byKey.has(key)) byKey.set(key, item)
    }
  }

  const candidates = [...byKey.values()]
  const koreanCount = candidates.filter((c) => c.korean).length

  writeFileSync('data/candidates.json', JSON.stringify(candidates, null, 2) + '\n')
  console.log(`data/candidates.json 작성 완료 — ${candidates.length}개 (한국 작품 ${koreanCount}개)`)
  console.log('\n다음 단계: 이 목록을 라벨링해 data/labels.json을 채운 뒤 npm run build:pool')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
