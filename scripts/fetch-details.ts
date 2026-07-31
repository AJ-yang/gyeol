import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { CHUNK_COUNT, detailChunk, detailChunkPath, type DetailChunk, type WorkDetail } from '../lib/gyeol/details'
import { workKey, type Catalog } from '../lib/gyeol/types'

/**
 * 작품별 줄거리·평점을 모아 public/details/NNN.json 512개로 굽는다.
 *
 * 추천받은 작품을 눌렀을 때 "이게 뭔지"를 알려주려면 줄거리가 있어야 한다.
 * 그런데 줄거리를 전부 합치면 한글 UTF-8 기준 수 MB라 색인처럼 통째로
 * 내려보낼 수 없다. 그래서 id로 512개 청크에 나눠 담고, 클라이언트는 누른
 * 작품이 든 청크 하나만 받는다.
 *
 * TMDB 키가 필요하므로 빌드 때만 돈다. 브라우저에서 직접 부르면 키가 번들에
 * 박힌다.
 */
const TMDB_API_KEY = process.env.TMDB_API_KEY
if (!TMDB_API_KEY) throw new Error('TMDB_API_KEY not set — .env.local을 확인하라')

const CONCURRENCY = 20
const RETRY_DELAY_MS = 2000

/**
 * 줄거리 길이 상한.
 *
 * 모달에서 읽을 만큼만 있으면 된다. TMDB에는 드물게 수천 자짜리 줄거리가
 * 있는데, 그런 것 몇 개가 청크 하나를 통째로 부풀린다.
 */
const OVERVIEW_LIMIT = 400

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

type TmdbDetail = {
  overview?: string
  vote_average?: number
  runtime?: number
  episode_run_time?: number[]
  number_of_seasons?: number
}

/** 문장 끝에서 자른다. 중간에서 끊으면 읽다 만 느낌이 난다. */
function trim(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= OVERVIEW_LIMIT) return clean
  const cut = clean.slice(0, OVERVIEW_LIMIT)
  const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('다. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '))
  return (stop > OVERVIEW_LIMIT * 0.6 ? cut.slice(0, stop + 1) : cut.trimEnd()) + '…'
}

async function detailOf(
  media: 0 | 1,
  id: number,
  language: string,
  attempt = 0,
): Promise<TmdbDetail | null> {
  const path = media === 0 ? 'movie' : 'tv'
  const url = `https://api.themoviedb.org/3/${path}/${id}?api_key=${TMDB_API_KEY}&language=${language}`
  const response = await fetch(url)
  if (response.status === 429 && attempt < 3) {
    await sleep(RETRY_DELAY_MS)
    return detailOf(media, id, language, attempt + 1)
  }
  if (!response.ok) return null
  return (await response.json()) as TmdbDetail
}

function toDetail(raw: TmdbDetail): WorkDetail {
  const detail: WorkDetail = {
    o: trim(raw.overview ?? ''),
    v: Math.round((raw.vote_average ?? 0) * 10) / 10,
    r: raw.runtime ?? raw.episode_run_time?.[0] ?? 0,
  }
  if (raw.number_of_seasons) detail.s = raw.number_of_seasons
  return detail
}

async function main() {
  const catalog = JSON.parse(readFileSync('public/catalog.json', 'utf8')) as Catalog
  const works = catalog.works
  const details = new Map<string, WorkDetail>()

  let done = 0
  let failed = 0

  for (let i = 0; i < works.length; i += CONCURRENCY) {
    const batch = works.slice(i, i + CONCURRENCY)
    const results = await Promise.all(batch.map((w) => detailOf(w.m, w.i, 'ko-KR')))
    batch.forEach((work, index) => {
      const raw = results[index]
      if (raw === null) failed += 1
      else details.set(workKey(work), toDetail(raw))
      done += 1
    })
    process.stderr.write(`\r  한국어 ${done}/${works.length}`)
  }
  process.stderr.write('\n')

  // 한국어 줄거리가 비어 있는 것만 영어로 다시 받는다. TMDB는 번역이 없으면
  // overview를 빈 문자열로 준다 — 없는 것과 구분이 안 되므로 직접 메워야 한다.
  const empty = works.filter((w) => {
    const detail = details.get(workKey(w))
    return detail !== undefined && detail.o === ''
  })
  let filled = 0
  for (let i = 0; i < empty.length; i += CONCURRENCY) {
    const batch = empty.slice(i, i + CONCURRENCY)
    const results = await Promise.all(batch.map((w) => detailOf(w.m, w.i, 'en-US')))
    batch.forEach((work, index) => {
      const text = results[index]?.overview
      if (text) {
        details.get(workKey(work))!.o = trim(text)
        filled += 1
      }
    })
    process.stderr.write(`\r  영어 보강 ${Math.min(i + CONCURRENCY, empty.length)}/${empty.length}`)
  }
  if (empty.length > 0) process.stderr.write('\n')

  // 청크로 나눠 쓴다. 매번 통째로 지우고 다시 써야 지난 실행의 잔재가 안 남는다.
  rmSync('public/details', { recursive: true, force: true })
  mkdirSync('public/details', { recursive: true })

  const chunks: DetailChunk[] = Array.from({ length: CHUNK_COUNT }, () => ({}))
  for (const work of works) {
    const detail = details.get(workKey(work))
    if (detail === undefined) continue
    chunks[detailChunk(work)][workKey(work)] = detail
  }

  let raw = 0
  let gzip = 0
  let biggest = 0
  chunks.forEach((chunk, index) => {
    const json = JSON.stringify(chunk)
    writeFileSync(`public/${detailChunkPath(index)}`, json)
    // 글자 수(json.length)가 아니라 바이트로 잰다. 한글은 UTF-8에서 3바이트라
    // 글자 수로 재면 실제의 3분의 1로 보고되어 gzip이 raw보다 커 보인다.
    raw += Buffer.byteLength(json, 'utf8')
    const packed = gzipSync(json).length
    gzip += packed
    biggest = Math.max(biggest, packed)
  })

  const noOverview = [...details.values()].filter((d) => d.o === '').length
  console.log(`상세 ${details.size}건 → public/details/ (${CHUNK_COUNT}개 청크)`)
  console.log(`  조회 실패 ${failed}건 / 한국어 줄거리 없어 영어로 메운 것 ${filled}건`)
  console.log(`  끝내 줄거리 없는 작품 ${noOverview}건 (${((100 * noOverview) / Math.max(details.size, 1)).toFixed(1)}%)`)
  console.log(`  전체 raw ${(raw / 1024 / 1024).toFixed(1)}MB / gzip ${(gzip / 1024).toFixed(0)}KB`)
  console.log(`  청크 하나 평균 gzip ${(gzip / CHUNK_COUNT / 1024).toFixed(1)}KB / 최대 ${(biggest / 1024).toFixed(1)}KB`)
}

main()
