// lib/gyeol/sections.ts
import { GENRE_INDEX } from './genres'
import { seededShuffle } from '../rng'
import { workKey, type CatalogEntry, type GenreLabel } from './types'

export type SectionDef = { name: string; genres: GenreLabel[] }
export type Section = { name: string; works: CatalogEntry[] }

/**
 * 1라운드 섹션.
 *
 * **좁은 것부터 먼저 배정한다.** 작품을 한 섹션에만 넣으므로, 넓은 섹션이
 * 먼저 가져가면 좁은 섹션이 굶는다. 공포는 1,568편뿐이고 코미디는 4,423편이라
 * 코미디를 먼저 배정하면 공포 작품이 코미디로 빨려 들어간다.
 *
 * **드라마 장르는 쓰지 않는다.** 작품의 60.7%에 붙어 있어 섹션이 뭉개진다.
 */
export const SECTION_DEFS: SectionDef[] = [
  { name: '공포·오컬트', genres: ['공포'] },
  { name: '사극·전쟁', genres: ['역사', '전쟁'] },
  { name: '애니·가족', genres: ['애니', '가족'] },
  { name: '로맨스', genres: ['로맨스'] },
  { name: 'SF·판타지', genres: ['SF', '판타지'] },
  { name: '범죄·스릴러', genres: ['범죄', '스릴러', '미스터리'] },
  { name: '액션·모험', genres: ['액션', '모험'] },
  { name: '코미디', genres: ['코미디'] },
]

const PER_SECTION = 6

/**
 * 섹션 안에서도 네 분면을 갈라 뽑는다.
 *
 * 갈라두지 않으면 영화가 인지도 상위를 독점해 오징어 게임도 도깨비도 사라진다.
 * `works` 배열이 한국영화 → 한국TV → 해외영화 → 해외TV 순이라 그냥 앞에서
 * 뽑으면 한국 영화만 나온다.
 */
const QUOTA: { ko: 0 | 1; m: 0 | 1; count: number }[] = [
  { ko: 1, m: 0, count: 2 },
  { ko: 1, m: 1, count: 1 },
  { ko: 0, m: 0, count: 2 },
  { ko: 0, m: 1, count: 1 },
]

export function buildSections(works: CatalogEntry[]): Section[] {
  const used = new Set<string>()

  return SECTION_DEFS.map((def) => {
    const wanted = new Set(def.genres.map((g) => GENRE_INDEX[g]))
    const pool = works.filter(
      (w) => !used.has(workKey(w)) && w.g.some((g) => wanted.has(g)),
    )

    const picked: CatalogEntry[] = []
    const take = (candidates: CatalogEntry[], count: number) => {
      for (const work of candidates) {
        if (picked.length >= PER_SECTION || count <= 0) break
        if (picked.includes(work)) continue
        picked.push(work)
        count -= 1
      }
    }

    for (const quota of QUOTA) {
      take(pool.filter((w) => w.ko === quota.ko && w.m === quota.m), quota.count)
    }
    // 쿼터를 못 채운 분면이 있으면 남은 것으로 메운다.
    take(pool, PER_SECTION - picked.length)

    picked.forEach((w) => used.add(workKey(w)))
    return { name: def.name, works: picked }
  })
}

/**
 * 섹션을 평평하게 펴서 섞은 뒤 고를 후보를 낸다.
 *
 * **장르 이름을 화면에 내보내지 않는다.** "로맨스"라는 머리말이 있으면
 * 사용자가 작품에 반응하는 대신 장르 라벨에 반응한다. 섹션은 무엇을 고를지
 * 정하는 데만 쓰고, 보여줄 때는 섞어서 라벨 없이 깐다.
 *
 * 섞어도 선정 자체는 섹션이 보장하므로 여덟 갈래가 골고루 덮이고 각 갈래
 * 안에서 한국/해외·영화/드라마가 섞인다.
 */
export function buildPickPool(works: CatalogEntry[], rng: () => number): CatalogEntry[] {
  return seededShuffle(buildSections(works).flatMap((s) => s.works), rng)
}
