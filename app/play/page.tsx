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

function newSeed() {
  // makeRng는 정수 시드만 받는다. Math.random()을 그대로 넘기면 전 세션이 시드 0으로 붕괴한다.
  return Math.floor(Math.random() * 2 ** 31)
}

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
  const [seed, setSeed] = useState(newSeed)
  const [choices, setChoices] = useState<Choice[]>([])
  // 사용자가 "몰라요"를 누른 작품. 세션 로컬 상태이며 채점과 공유 링크에는 들어가지 않는다.
  const [excluded, setExcluded] = useState<ReadonlySet<number>>(() => new Set())

  const pair = useMemo(
    () => (mounted ? nextPair(POOL, choices, seed, excluded) : null),
    [mounted, choices, seed, excluded],
  )

  function pick(winner: number, loser: number) {
    const next = [...choices, { winner, loser }]
    if (next.length >= ROUNDS) {
      const { code } = score(POOL, next)
      // trailingSlash 설정을 켰으므로 정적 경로도 슬래시로 끝난다.
      router.push(`/r/${code}/?p=${encodeChoices(next)}`)
      return
    }
    setChoices(next)
  }

  /** 그 작품만 후보에서 뺀다. 상대편은 다음 페어에 다시 나올 수 있고 라운드는 소모되지 않는다. */
  function skip(index: number) {
    setExcluded((prev) => new Set(prev).add(index))
  }

  function restart() {
    setSeed(newSeed())
    setChoices([])
    setExcluded(new Set())
  }

  // 제외가 쌓여 남은 작품으로 쌍을 만들 수 없는 상태. 진행 중 throw로 화면이 죽는 대신
  // 여기서 끝을 알린다. 12라운드를 못 채웠으니 조기 채점은 하지 않는다 (설계 문서 2절).
  if (mounted && pair === null) {
    return (
      <main className="mx-auto flex h-dvh max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="text-2xl font-bold text-white">아는 작품이 너무 적어요</h1>
        <p className="text-neutral-400">
          몰라요로 걸러낸 작품이 많아 남은 문항을 만들 수 없어요.
          <br />
          처음부터 다시 해보면 다른 작품이 나옵니다.
        </p>
        <button
          onClick={restart}
          className="rounded-full bg-white px-6 py-3 font-bold text-black transition hover:bg-neutral-200 focus:outline-none focus:ring-4 focus:ring-white/40"
        >
          다시 시작
        </button>
      </main>
    )
  }

  const progress = (choices.length / ROUNDS) * 100

  return (
    <main className="mx-auto flex h-dvh max-w-3xl flex-col gap-4 px-4 py-6">
      <div>
        <div className="mb-2 flex justify-between text-sm text-neutral-400">
          <span>
            {choices.length + 1} / {ROUNDS}
          </span>
          <span>본 작품 중 더 끌리는 쪽을 고르세요</span>
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
            <PosterCard
              work={POOL[pair.left]}
              onPick={() => pick(pair.left, pair.right)}
              onSkip={() => skip(pair.left)}
            />
            <PosterCard
              work={POOL[pair.right]}
              onPick={() => pick(pair.right, pair.left)}
              onSkip={() => skip(pair.right)}
            />
          </>
        )}
      </div>
    </main>
  )
}
