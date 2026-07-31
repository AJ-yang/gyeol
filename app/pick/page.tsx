'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Duel } from '@/components/Duel'
import { WorkGrid } from '@/components/WorkGrid'
import { nextDuel } from '@/lib/gyeol/duel'
import { searchWorks } from '@/lib/gyeol/grid'
import { matchGyeol } from '@/lib/gyeol/match'
import { encodePicks } from '@/lib/gyeol/payload'
import { makeRng } from '@/lib/rng'
import { buildPickPool } from '@/lib/gyeol/pool'
import { GYEOL_TYPES } from '@/data/gyeol-types'
import { useCatalog } from '@/lib/gyeol/use-catalog'
import { workKey, type CatalogEntry } from '@/lib/gyeol/types'

/**
 * 최소 선택 수. 이 아래로는 결이 거의 갈리지 않는다.
 *
 * 상한은 두지 않는다. 더 고를수록 결이 정확해지는데 막을 이유가 없고,
 * 본 작품이 적은 사람이 막히지 않아야 한다 (PRD 3절).
 */
const MIN_PICKS = 5

/** 2라운드 대결 상한. 이 안에 못 가르면 그대로 결과로 보낸다. */
const MAX_DUELS = 5

export default function PickPage() {
  const router = useRouter()
  const { catalog, failed } = useCatalog()
  const [picks, setPicks] = useState<CatalogEntry[]>([])
  const [query, setQuery] = useState('')
  const [inDuels, setInDuels] = useState(false)
  const [duelsDone, setDuelsDone] = useState(0)
  const [seen, setSeen] = useState<ReadonlySet<string>>(new Set())

  // 세션마다 순서를 바꾸되 리렌더에는 흔들리지 않게 시드를 한 번만 뽑는다.
  const [seed] = useState(() => Math.floor(Math.random() * 2 ** 31))

  const selected = useMemo(() => new Set(picks.map(workKey)), [picks])
  const pool = useMemo(
    () => (catalog ? buildPickPool(catalog, GYEOL_TYPES, makeRng(seed)) : []),
    [catalog, seed],
  )
  const searchHits = useMemo(
    () => (catalog ? searchWorks(catalog.works, query, 12) : []),
    [catalog, query],
  )

  // 2라운드는 1라운드가 잡은 기준선 위에서 붙어 있는 결을 가른다.
  const duel = useMemo(() => {
    if (!catalog || !inDuels || duelsDone >= MAX_DUELS) return null
    return nextDuel(picks, matchGyeol(picks, catalog, GYEOL_TYPES), catalog, GYEOL_TYPES, seen)
  }, [catalog, inDuels, duelsDone, picks, seen])

  // 대결이 끝났거나 더 물을 것이 없는 상태.
  const duelsOver = inDuels && catalog !== null && duel === null

  // 렌더 도중에 router.push를 부르면 React가 다른 컴포넌트를 갱신한다고 막는다.
  // "Cannot update a component (Router) while rendering a different component".
  useEffect(() => {
    if (!duelsOver) return
    router.push(`/result/?p=${encodePicks(picks.map((w) => ({ i: w.i, m: w.m })))}`)
  }, [duelsOver, picks, router])

  function answerDuel(winner: CatalogEntry | null) {
    if (duel === null) return
    setSeen((current) => new Set([...current, workKey(duel.left.work), workKey(duel.right.work)]))
    if (winner !== null) setPicks((current) => [...current, winner])
    setDuelsDone((n) => n + 1)
  }

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

  // 이동은 위 useEffect가 한다. 여기서는 기다리는 화면만 그린다.
  if (duelsOver) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <p className="animate-pulse text-neutral-500">결을 읽는 중…</p>
      </main>
    )
  }

  if (inDuels) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-6 px-4 py-6">
        <Duel
          duel={duel!}
          round={duelsDone + 1}
          total={MAX_DUELS}
          onPick={(work) => answerDuel(work)}
          onSkip={() => answerDuel(null)}
        />
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
                onClick={() => {
                  setSeen(new Set(picks.map(workKey)))
                  setInDuels(true)
                }}
                className="ml-auto shrink-0 rounded-full bg-white px-5 py-2 font-bold text-black"
              >
                다음
              </button>
            </>
          )}
        </div>

        {/*
          검색을 헤더 안에 두어 스크롤해도 따라오게 한다. 후보 50편은 결마다
          가장 알려진 작품을 뽑느라 영화로 채워지므로, 드라마만 보는 사람은
          여기서 직접 넣어야 한다. 문구로 드라마를 명시하지 않으면 그 길이
          있다는 것 자체를 모른다.
        */}
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="드라마·영화 제목으로 검색해서 추가"
          className="mt-2 w-full rounded-full bg-neutral-900 px-4 py-2.5 text-sm outline-none placeholder:text-neutral-500 focus:ring-2 focus:ring-white/40"
        />
      </header>

      {query.trim() !== '' &&
        (searchHits.length > 0 ? (
          <WorkGrid works={searchHits} selected={selected} onToggle={toggle} />
        ) : (
          <p className="break-keep py-4 text-center text-sm text-neutral-600">
            그 제목으로 찾지 못했어요.
          </p>
        ))}

      <WorkGrid works={pool} selected={selected} onToggle={toggle} />
    </main>
  )
}
