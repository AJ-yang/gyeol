'use client'

import { useMemo, useState, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { PosterCard } from '@/components/PosterCard'
import worksData from '@/data/works.json'
import { encodeChoices } from '@/lib/payload'
import { score } from '@/lib/scoring'
import { nextPair } from '@/lib/selector'
import { ROUNDS, type Choice, type Work } from '@/lib/types'

const POOL = worksData as Work[]

const noop = () => () => {}

export default function PlayPage() {
  const router = useRouter()
  // 서버 렌더와 하이드레이션 중에는 false, 그 뒤 클라이언트에서만 true.
  // 서버가 뽑은 시드로 문항을 그리면 클라이언트와 달라져 하이드레이션이 깨지므로,
  // 마운트 전에는 문항 대신 스켈레톤을 그린다.
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  )
  // makeRng는 정수 시드만 받는다. Math.random()을 그대로 넘기면 전 세션이 시드 0으로 붕괴한다.
  const [seed] = useState(() => Math.floor(Math.random() * 2 ** 31))
  const [choices, setChoices] = useState<Choice[]>([])

  const pair = useMemo(() => (mounted ? nextPair(POOL, choices, seed) : null), [mounted, choices, seed])

  function pick(winner: number, loser: number) {
    const next = [...choices, { winner, loser }]
    if (next.length >= ROUNDS) {
      const { code } = score(POOL, next)
      router.push(`/r/${code}?p=${encodeChoices(next)}`)
      return
    }
    setChoices(next)
  }

  const progress = (choices.length / ROUNDS) * 100

  return (
    <main className="mx-auto flex h-dvh max-w-3xl flex-col gap-4 px-4 py-6">
      <div>
        <div className="mb-2 flex justify-between text-sm text-neutral-400">
          <span>
            {choices.length + 1} / {ROUNDS}
          </span>
          <span>더 끌리는 쪽을 고르세요</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
          <div className="h-full rounded-full bg-white transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-rows-2 gap-3 sm:grid-cols-2 sm:grid-rows-1 sm:gap-5">
        {pair === null ? (
          <>
            <div className="animate-pulse rounded-2xl bg-neutral-900" />
            <div className="animate-pulse rounded-2xl bg-neutral-900" />
          </>
        ) : (
          <>
            <PosterCard work={POOL[pair.left]} onPick={() => pick(pair.left, pair.right)} />
            <PosterCard work={POOL[pair.right]} onPick={() => pick(pair.right, pair.left)} />
          </>
        )}
      </div>
    </main>
  )
}
