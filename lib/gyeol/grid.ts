// lib/gyeol/grid.ts
import { workKey, type CatalogEntry } from './types'

/**
 * 그리드에 깔 작품을 고른다.
 *
 * 색인의 works는 네 그룹(한국/해외 × 영화/TV)이 이어 붙어 있고 각 그룹 안은
 * vote_count 내림차순이다. 따라서 `filter` 결과의 앞쪽이 그 그룹의 인지도
 * 상위다. 이 성질은 catalog-order.test.ts가 잠근다.
 *
 * 네 그룹을 모두 섞는 이유는 한 그룹으로만 채우면 한국 드라마만 보는 사람이
 * 아무것도 못 고르기 때문이다.
 */
const GROUPS: { ko: 0 | 1; m: 0 | 1 }[] = [
  { ko: 1, m: 0 },
  { ko: 1, m: 1 },
  { ko: 0, m: 0 },
  { ko: 0, m: 1 },
]

function byGroup(works: CatalogEntry[]): CatalogEntry[][] {
  return GROUPS.map((g) => works.filter((w) => w.ko === g.ko && w.m === g.m))
}

/** 그룹에서 번갈아 하나씩 꺼내 요청한 개수를 채운다. */
function interleave(groups: CatalogEntry[][], count: number): CatalogEntry[] {
  const out: CatalogEntry[] = []
  const cursors = groups.map(() => 0)
  while (out.length < count) {
    let advanced = false
    for (let g = 0; g < groups.length && out.length < count; g += 1) {
      const next = groups[g][cursors[g]]
      if (next === undefined) continue
      cursors[g] += 1
      out.push(next)
      advanced = true
    }
    if (!advanced) break
  }
  return out
}

export function firstGrid(works: CatalogEntry[], count: number): CatalogEntry[] {
  return interleave(byGroup(works), count)
}

/**
 * 다음 라운드를 낸다. 고른 작품이 있으면 그 장르 쪽으로 기울인다.
 *
 * 적응형의 값어치는 정보 효율이 아니라 **1라운드에서 아무것도 못 고른 사용자를
 * 구제하는 것**이다. 고른 것이 없으면 그냥 다음 인지도 구간을 낸다.
 */
export function nextGrid(
  works: CatalogEntry[],
  shown: ReadonlySet<string>,
  picks: CatalogEntry[],
  count: number,
): CatalogEntry[] {
  const remaining = works.filter((w) => !shown.has(workKey(w)))
  if (picks.length === 0) return interleave(byGroup(remaining), count)

  const wanted = new Set(picks.flatMap((w) => w.g))
  const matching = remaining.filter((w) => w.g.some((g) => wanted.has(g)))
  const rest = remaining.filter((w) => !w.g.some((g) => wanted.has(g)))

  // 절반은 취향 쪽에서, 절반은 넓게. 한쪽으로만 채우면 취향이 좁게 굳는다.
  const half = Math.ceil(count / 2)
  const picked = interleave(byGroup(matching), half)
  const pickedKeys = new Set(picked.map(workKey))
  const filler = interleave(
    byGroup([...matching.filter((w) => !pickedKeys.has(workKey(w))), ...rest]),
    count - picked.length,
  )
  return [...picked, ...filler]
}

/** 제목으로 찾는다. 색인이 브라우저에 있으므로 서버가 필요 없다. */
export function searchWorks(works: CatalogEntry[], query: string, limit: number): CatalogEntry[] {
  const needle = query.trim().toLowerCase()
  if (needle === '') return []
  const out: CatalogEntry[] = []
  for (const work of works) {
    if (work.t.toLowerCase().includes(needle)) {
      out.push(work)
      if (out.length >= limit) break
    }
  }
  return out
}
