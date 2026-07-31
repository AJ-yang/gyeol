import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import type { Catalog } from '../lib/gyeol/types'

/**
 * 작품별 TMDB 추천을 public/rec/<m>-<id>.json으로 굽는다.
 *
 * 파일을 쪼개는 이유는 클라이언트가 고른 것만 받게 하기 위해서다. 하나로
 * 합치면 수백 KB를 통째로 내려받아야 한다.
 *
 * 추천 대상은 색인 안에 있는 작품으로 제한한다. 색인 밖 작품은 제목도
 * 포스터도 없어 화면에 그릴 수 없다.
 */
const TMDB_API_KEY = process.env.TMDB_API_KEY
if (!TMDB_API_KEY) throw new Error('TMDB_API_KEY not set — .env.local을 확인하라')

const CONCURRENCY = 20
const TOP_N = 20
const RETRY_DELAY_MS = 2000

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

type RecResult = { id: number }

async function recommendationsOf(media: 0 | 1, id: number, attempt = 0): Promise<number[]> {
  const path = media === 0 ? 'movie' : 'tv'
  const url = `https://api.themoviedb.org/3/${path}/${id}/recommendations?api_key=${TMDB_API_KEY}&language=ko-KR`
  const response = await fetch(url)
  if (response.status === 429 && attempt < 3) {
    await sleep(RETRY_DELAY_MS)
    return recommendationsOf(media, id, attempt + 1)
  }
  if (!response.ok) return []
  const data = (await response.json()) as { results?: RecResult[] }
  return (data.results ?? []).slice(0, TOP_N).map((r) => r.id)
}

async function main() {
  const catalog = JSON.parse(readFileSync('public/catalog.json', 'utf8')) as Catalog
  const known = new Set(catalog.works.map((w) => `${w.m}:${w.i}`))
  mkdirSync('public/rec', { recursive: true })

  let written = 0
  let empty = 0
  let kept = 0
  let dropped = 0

  for (let i = 0; i < catalog.works.length; i += CONCURRENCY) {
    const batch = catalog.works.slice(i, i + CONCURRENCY)
    const results = await Promise.all(batch.map((w) => recommendationsOf(w.m, w.i)))
    batch.forEach((work, index) => {
      // 색인에 있는 추천만 남긴다. 없는 것은 제목도 포스터도 없어 그릴 수 없다.
      const all = results[index]
      const ids = all.filter((id) => known.has(`${work.m}:${id}`))
      kept += ids.length
      dropped += all.length - ids.length
      if (ids.length === 0) empty += 1
      writeFileSync(`public/rec/${work.m}-${work.i}.json`, JSON.stringify(ids))
      written += 1
    })
    process.stderr.write(`\r  ${written}/${catalog.works.length}`)
  }
  process.stderr.write('\n')

  const total = kept + dropped
  console.log(`추천 ${written}건 → public/rec/`)
  console.log(`  추천이 하나도 안 남은 작품 ${empty}건 (${((100 * empty) / written).toFixed(1)}%)`)
  console.log(`  색인 안 추천 ${kept}건 / 색인 밖이라 버린 것 ${dropped}건 (유지율 ${((100 * kept) / Math.max(total, 1)).toFixed(1)}%)`)
}

main()
