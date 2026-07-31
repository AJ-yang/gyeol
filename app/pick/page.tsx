'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { WorkGrid } from '@/components/WorkGrid'
import { searchWorks } from '@/lib/gyeol/grid'
import { encodePicks } from '@/lib/gyeol/payload'
import { makeRng } from '@/lib/rng'
import { buildPickPool } from '@/lib/gyeol/sections'
import { useCatalog } from '@/lib/gyeol/use-catalog'
import { workKey, type CatalogEntry } from '@/lib/gyeol/types'

/**
 * 최소 선택 수. 이 아래로는 결이 거의 갈리지 않는다.
 *
 * 상한은 두지 않는다. 더 고를수록 결이 정확해지는데 막을 이유가 없고,
 * 본 작품이 적은 사람이 막히지 않아야 한다 (PRD 3절).
 */
const MIN_PICKS = 5

export default function PickPage() {
  const router = useRouter()
  const { catalog, failed } = useCatalog()
  const [picks, setPicks] = useState<CatalogEntry[]>([])
  const [query, setQuery] = useState('')

  // 세션마다 순서를 바꾸되 리렌더에는 흔들리지 않게 시드를 한 번만 뽑는다.
  const [seed] = useState(() => Math.floor(Math.random() * 2 ** 31))

  const selected = useMemo(() => new Set(picks.map(workKey)), [picks])
  const pool = useMemo(
    () => (catalog ? buildPickPool(catalog.works, makeRng(seed)) : []),
    [catalog, seed],
  )
  const searchHits = useMemo(
    () => (catalog ? searchWorks(catalog.works, query, 12) : []),
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
        <button
          onClick={() => location.reload()}
          className="rounded-full bg-white px-6 py-3 font-bold text-black"
        >
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

  const remaining = MIN_PICKS - picks.length

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-4 px-4 py-6">
      <header className="sticky top-0 z-10 -mx-4 bg-neutral-950/90 px-4 py-3 backdrop-blur">
        <p className="break-keep text-sm text-neutral-400">재미있게 본 작품을 모두 골라주세요</p>
        <div className="mt-2 flex items-center gap-3">
          <span className="shrink-0 text-lg font-bold">{picks.length}편</span>
          {remaining > 0 ? (
            <span className="break-keep text-sm text-neutral-500">
              {remaining}편 더 고르면 결과를 볼 수 있어요
            </span>
          ) : (
            <>
              <span className="break-keep text-sm text-neutral-500">더 고를수록 정확해져요</span>
              <button
                onClick={() =>
                  router.push(`/result/?p=${encodePicks(picks.map((w) => ({ i: w.i, m: w.m })))}`)
                }
                className="ml-auto shrink-0 rounded-full bg-white px-5 py-2 font-bold text-black"
              >
                결과 보기
              </button>
            </>
          )}
        </div>
      </header>

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="찾는 작품이 없다면 제목으로 검색"
        className="w-full rounded-full bg-neutral-900 px-4 py-2.5 text-sm outline-none placeholder:text-neutral-600 focus:ring-2 focus:ring-white/40"
      />

      {query.trim() !== '' && <WorkGrid works={searchHits} selected={selected} onToggle={toggle} />}

      <WorkGrid works={pool} selected={selected} onToggle={toggle} />
    </main>
  )
}
