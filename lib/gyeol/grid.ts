import type { CatalogEntry } from './types'

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
