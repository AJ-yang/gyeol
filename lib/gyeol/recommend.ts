// lib/gyeol/recommend.ts
import { workKey, type CatalogEntry } from './types'

/** `public/recommendations.json`의 형태. 키는 `<media>-<tmdbId>`다. */
export type RecommendationMap = Record<string, number[]>

/**
 * 고른 작품들의 TMDB 추천을 합쳐 순위를 매긴다.
 *
 * 개인화 단위가 유형이 아니라 **고른 작품**이다. 같은 결을 받은 두 사람도
 * 고른 작품이 다르면 추천이 다르다. 유형 단위로 하면 같은 코드를 받은 모든
 * 사람이 동일한 목록을 본다.
 *
 * 여러 작품에서 겹쳐 추천된 것을 앞에 둔다. 한 번만 추천된 것보다 취향의
 * 중심에 가깝다는 뜻이기 때문이다.
 */
export function recommend(
  picks: CatalogEntry[],
  recommendations: RecommendationMap,
  works: CatalogEntry[],
  limit: number,
): CatalogEntry[] {
  const byKey = new Map(works.map((w) => [workKey(w), w]))
  const picked = new Set(picks.map(workKey))

  const votes = new Map<string, number>()
  for (const pick of picks) {
    // 추천이 하나도 안 남은 작품은 키 자체가 없다. 없으면 없는 것으로 읽는다.
    for (const id of recommendations[workKey(pick)] ?? []) {
      const key = `${pick.m}-${id}`
      if (picked.has(key)) continue
      if (!byKey.has(key)) continue
      votes.set(key, (votes.get(key) ?? 0) + 1)
    }
  }

  return [...votes.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key]) => byKey.get(key)!)
}
