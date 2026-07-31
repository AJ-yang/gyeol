import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { GYEOL_TYPES } from '../data/gyeol-types'
import { normalizeGenres } from '../lib/gyeol/genres'
import { computeIdf } from '../lib/gyeol/idf'
import { buildVocabulary } from '../lib/gyeol/vocabulary'
import type { Catalog, CatalogEntry } from '../lib/gyeol/types'
import type { RawWork } from './fetch-catalog'

/**
 * 원본 둘을 합쳐 브라우저가 받을 public/catalog.json을 만든다.
 *
 * 조건 키워드 어휘 밖의 키워드는 담지 않는다. 점수에 들어가지 않으므로 색인에
 * 있을 이유가 없고, 이 덕분에 제작 메타데이터를 걸러낼 별도 차단 목록이
 * 필요 없다.
 */
function main() {
  const works = JSON.parse(readFileSync('data/catalog.raw.json', 'utf8')) as RawWork[]
  const keywords = JSON.parse(readFileSync('data/keywords.raw.json', 'utf8')) as Record<string, string[]>

  const vocabulary = buildVocabulary(GYEOL_TYPES)
  const vocabularyIndex = new Map(vocabulary.map((k, i) => [k, i]))

  const entries: CatalogEntry[] = works.map((work) => {
    const media = work.media === 'movie' ? 0 : 1
    const names = keywords[`${work.media}:${work.id}`] ?? []
    const k = [
      ...new Set(
        names
          .map((name) => vocabularyIndex.get(name))
          .filter((index): index is number => index !== undefined),
      ),
    ].sort((a, b) => a - b)

    return {
      i: work.id,
      m: media as 0 | 1,
      t: work.title,
      y: work.year,
      p: work.poster,
      g: normalizeGenres(work.genreIds, media as 0 | 1),
      k,
      ko: work.korean ? 1 : 0,
    }
  })

  const idf = computeIdf(vocabulary.length, entries.map((e) => e.k))
  const catalog: Catalog = { vocabulary, idf, works: entries }

  mkdirSync('public', { recursive: true })
  const json = JSON.stringify(catalog)
  writeFileSync('public/catalog.json', json)

  const matched = entries.filter((e) => e.k.length > 0).length
  console.log(`작품 ${entries.length}편 → public/catalog.json`)
  console.log(`  어휘 ${vocabulary.length}종`)
  console.log(`  조건 키워드를 1개 이상 가진 작품 ${matched}편 (${((100 * matched) / entries.length).toFixed(1)}%)`)
  console.log(`  raw ${(json.length / 1024).toFixed(0)}KB / gzip ${(gzipSync(json).length / 1024).toFixed(0)}KB`)
}

main()
