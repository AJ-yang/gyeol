import { workKey, type Catalog, type CatalogEntry, type Gyeol } from './types'

/**
 * 결과로 나온 결과 맞닿은 작품을 골고루 고른다.
 *
 * **점수 순으로 줄 세우지 않고 키워드를 돌아가며 뽑는다.** 결의 조건 키워드는
 * 서로 다른 얼굴을 가리키는데(「끝까지 남는 결」의 zombie·apocalypse·survival),
 * 점수가 높은 순으로 열 편을 뽑으면 표를 가장 많이 받은 한 갈래가 목록을 통째로
 * 먹는다. 실제로 좀비물이 추천을 다 채워 "다 비슷한 것만 나온다"가 됐다.
 *
 * **키워드 순서는 고른 작품이 정한다.** 결만 보고 뽑으면 같은 결을 받은 모든
 * 사람이 똑같은 목록을 본다. 사용자가 실제로 고른 작품이 많이 걸린 키워드를
 * 앞에 두면, 같은 「끝까지 남는 결」이라도 좀비를 고른 사람과 종말물을 고른
 * 사람의 첫 추천이 달라진다.
 *
 * **한국/해외를 번갈아 뽑는다.** 카탈로그 순서는 전역 인지도 순이 아니라
 * 한국과 해외가 각각 vote_count 내림차순으로 묶여 있는 형태다. 전체의 7.8%만
 * 한국인데도 조건 키워드 후보의 상위 50편은 39~50편이 한국이라, 앞에서부터
 * 뽑으면 목록이 한국 작품으로만 찬다. 그룹 안에서만 순서를 믿을 수 있다.
 */
export function recommendByGyeol(
  gyeol: Gyeol,
  catalog: Catalog,
  picks: CatalogEntry[],
  limit: number,
): CatalogEntry[] {
  const vocabularyIndex = new Map(catalog.vocabulary.map((k, i) => [k, i]))

  // 어휘에 없는 조건 키워드는 조용히 건너뛴다. 색인을 다시 만들면 어휘가
  // 바뀔 수 있는데, 그때 추천이 통째로 죽는 것보다 낫다.
  const wanted = gyeol.keywords
    .map((k) => vocabularyIndex.get(k))
    .filter((i): i is number => i !== undefined)
  if (wanted.length === 0) return []

  const excluded = new Set(picks.map(workKey))

  // 키워드별 후보. 한 작품이 여러 키워드에 들어갈 수 있고, 뽑을 때 걸러낸다.
  const buckets = new Map<number, CatalogEntry[]>(wanted.map((k) => [k, []]))
  for (const work of catalog.works) {
    if (excluded.has(workKey(work))) continue
    for (const index of new Set(work.k)) {
      buckets.get(index)?.push(work)
    }
  }

  // 고른 작품이 각 키워드에 몇 번 걸렸는지. 많이 걸린 쪽이 그 사람의 중심이다.
  const strength = new Map<number, number>(wanted.map((k) => [k, 0]))
  for (const pick of picks) {
    for (const index of new Set(pick.k)) {
      const current = strength.get(index)
      if (current !== undefined) strength.set(index, current + 1)
    }
  }

  // 센 키워드부터. 같으면 희귀한(IDF 높은) 키워드를 앞에 둔다 — 흔한 키워드가
  // 앞서면 그 결만의 색이 안 드러난다.
  const order = [...wanted].sort((a, b) => {
    const byStrength = (strength.get(b) ?? 0) - (strength.get(a) ?? 0)
    if (byStrength !== 0) return byStrength
    return (catalog.idf[b] ?? 0) - (catalog.idf[a] ?? 0)
  })

  const taken = new Set<string>()
  const picked: CatalogEntry[] = []
  let koreanCount = 0

  /**
   * 버킷에서 다음 한 편을 꺼낸다. 지금까지 뽑은 것이 한쪽으로 기울어 있으면
   * 반대쪽을 먼저 찾고, 없으면 남은 아무거나 가져온다 — 한쪽이 모자란다고
   * 자리를 비워 두면 추천이 열 편이 안 된다.
   */
  const takeFrom = (bucket: CatalogEntry[]): CatalogEntry | null => {
    const foreignCount = picked.length - koreanCount
    const wantKorean = koreanCount < foreignCount ? 1 : koreanCount > foreignCount ? 0 : null

    const fresh = bucket.filter((w) => !taken.has(workKey(w)))
    const chosen =
      (wantKorean === null ? undefined : fresh.find((w) => w.ko === wantKorean)) ?? fresh[0]
    if (chosen === undefined) return null

    taken.add(workKey(chosen))
    if (chosen.ko === 1) koreanCount += 1
    return chosen
  }

  // 키워드를 한 바퀴씩 돌며 한 편씩 가져간다. 한 바퀴에 아무도 못 가져가면
  // 남은 후보가 없다는 뜻이라 멈춘다.
  while (picked.length < limit) {
    let advanced = false
    for (const keyword of order) {
      if (picked.length >= limit) break
      const chosen = takeFrom(buckets.get(keyword) ?? [])
      if (chosen === null) continue
      picked.push(chosen)
      advanced = true
    }
    if (!advanced) break
  }

  return picked
}
