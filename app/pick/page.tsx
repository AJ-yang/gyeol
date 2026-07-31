// app/pick/page.tsx
'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { WorkGrid } from '@/components/WorkGrid'
import { firstGrid, nextGrid, searchWorks } from '@/lib/gyeol/grid'
import { encodePicks } from '@/lib/gyeol/payload'
import { useCatalog } from '@/lib/gyeol/use-catalog'
import { workKey, type CatalogEntry } from '@/lib/gyeol/types'

const ROUND_SIZE = 20
const MIN_PICKS = 5

export default function PickPage() {
  const router = useRouter()
  const { catalog, failed } = useCatalog()
  const [rounds, setRounds] = useState(1)
  const [picks, setPicks] = useState<CatalogEntry[]>([])
  const [query, setQuery] = useState('')

  const selected = useMemo(() => new Set(picks.map(workKey)), [picks])

  // 라운드가 늘 때마다 앞 라운드를 그대로 유지한 채 뒤에 이어 붙인다.
  const shownWorks = useMemo(() => {
    if (!catalog) return []
    const out = firstGrid(catalog.works, ROUND_SIZE)
    for (let round = 1; round < rounds; round += 1) {
      const shown = new Set(out.map(workKey))
      out.push(...nextGrid(catalog.works, shown, picks, ROUND_SIZE))
    }
    return out
    // picks를 넣지 않는 이유: 고를 때마다 그리드가 재배치되면 손이 못 따라간다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog, rounds])

  const searchHits = useMemo(
    () => (catalog ? searchWorks(catalog.works, query, 10) : []),
    [catalog, query],
  )

  function toggle(work: CatalogEntry) {
    const key = workKey(work)
    setPicks((current) =>
      current.some((w) => workKey(w) === key)
        ? current.filter((w) => workKey(w) !== key)
        : [...current, work],
    )
  }

  if (failed) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="break-keep text-neutral-300">작품 목록을 불러오지 못했어요.</p>
        <button onClick={() => location.reload()} className="rounded-full bg-white px-6 py-3 font-bold text-black">
          다시 시도
        </button>
      </main>
    )
  }

  if (!catalog) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <p className="animate-pulse text-neutral-500">작품을 불러오는 중…</p>
      </main>
    )
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-4 px-4 py-6">
      <header className="sticky top-0 z-10 -mx-4 bg-neutral-950/90 px-4 py-3 backdrop-blur">
        <p className="break-keep text-sm text-neutral-400">재미있게 본 작품을 모두 골라주세요</p>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-lg font-bold">{picks.length}편</span>
          {picks.length < MIN_PICKS ? (
            <span className="text-sm text-neutral-500">{MIN_PICKS - picks.length}편 더 고르면 결과를 볼 수 있어요</span>
          ) : (
            <button
              onClick={() => router.push(`/result/?p=${encodePicks(picks.map((w) => ({ i: w.i, m: w.m })))}`)}
              className="ml-auto rounded-full bg-white px-5 py-2 font-bold text-black"
            >
              결과 보기
            </button>
          )}
        </div>
      </header>

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="찾는 작품이 없다면 제목으로 검색"
        className="w-full rounded-full bg-neutral-900 px-4 py-2.5 text-sm outline-none placeholder:text-neutral-600 focus:ring-2 focus:ring-white/40"
      />

      {query.trim() !== '' && (
        <WorkGrid works={searchHits} selected={selected} onToggle={toggle} />
      )}

      <WorkGrid works={shownWorks} selected={selected} onToggle={toggle} />

      <button
        onClick={() => setRounds((r) => r + 1)}
        className="mx-auto rounded-full border border-neutral-700 px-6 py-3 text-sm text-neutral-300 transition hover:bg-neutral-900"
      >
        더 보기
      </button>
    </main>
  )
}
