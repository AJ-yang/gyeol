// app/result/page.tsx
'use client'

import { Suspense, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ShareCardButton } from '@/components/ShareCardButton'
import { GYEOL_TYPES } from '@/data/gyeol-types'
import { matchGyeol } from '@/lib/gyeol/match'
import { decodePicks } from '@/lib/gyeol/payload'
import { recommend } from '@/lib/gyeol/recommend'
import { useCatalog, useRecommendations } from '@/lib/gyeol/use-catalog'
import { workKey } from '@/lib/gyeol/types'

const RECOMMEND_COUNT = 10

function Result() {
  const params = useSearchParams()
  const payload = params.get('p')
  const { catalog } = useCatalog()
  const recommendations = useRecommendations(catalog !== null)

  const state = useMemo(() => {
    if (!catalog || payload === null) return null
    const refs = decodePicks(payload)
    if (refs === null) return { broken: true as const }

    const byKey = new Map(catalog.works.map((w) => [workKey(w), w]))
    const picks = refs.map((r) => byKey.get(workKey(r))).filter((w) => w !== undefined)
    if (picks.length === 0) return { broken: true as const }

    const top = matchGyeol(picks, catalog, GYEOL_TYPES)[0]
    const gyeol = GYEOL_TYPES.find((g) => g.id === top.id)!
    return { broken: false as const, gyeol, picks }
  }, [catalog, payload])

  if (!state) {
    return <p className="animate-pulse py-20 text-center text-neutral-500">결을 읽는 중…</p>
  }

  if (state.broken) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="break-keep text-neutral-300">결과를 읽을 수 없는 주소예요.</p>
        <Link href="/pick/" className="rounded-full bg-white px-6 py-3 font-bold text-black">
          처음부터 해보기
        </Link>
      </div>
    )
  }

  const picked = recommendations
    ? recommend(state.picks, recommendations, catalog!.works, RECOMMEND_COUNT)
    : []

  return (
    <>
      <header className="text-center">
        <p className="text-sm text-neutral-500">당신이 자꾸 고르는 이야기</p>
        <h1 className="mt-2 text-3xl font-black break-keep sm:text-4xl">{state.gyeol.name}</h1>
        <p className="mx-auto mt-4 max-w-md break-keep leading-relaxed text-neutral-300">
          {state.gyeol.description}
        </p>
      </header>

      <section>
        <h2 className="mb-3 text-sm font-bold text-neutral-400">당신이 고른 {state.picks.length}편</h2>
        <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-8">
          {state.picks.map((work) => (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={workKey(work)}
              src={`https://image.tmdb.org/t/p/w185/${work.p}`}
              alt={work.t}
              title={work.t}
              className="aspect-[2/3] w-full rounded-md bg-neutral-800 object-cover"
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold text-neutral-400">이런 것도 좋아할 거예요</h2>
        {recommendations === null ? (
          <p className="text-sm text-neutral-600">추천을 불러오는 중…</p>
        ) : picked.length === 0 ? (
          <p className="break-keep text-sm text-neutral-600">고른 작품이 적어 추천할 것을 찾지 못했어요.</p>
        ) : (
          <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-10">
            {picked.map((work) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={workKey(work)}
                src={`https://image.tmdb.org/t/p/w185/${work.p}`}
                alt={work.t}
                title={work.t}
                className="aspect-[2/3] w-full rounded-md bg-neutral-800 object-cover"
              />
            ))}
          </div>
        )}
      </section>

      {/*
        공유가 이 서비스가 퍼지는 유일한 경로라 결과 바로 아래, 다시 하기보다
        위에 둔다. 카드에는 고른 작품의 포스터가 들어간다.
      */}
      <div className="flex flex-col items-center gap-5">
        <ShareCardButton
          gyeolName={state.gyeol.name}
          description={state.gyeol.description}
          picks={state.picks}
        />
        <Link href="/pick/" className="text-sm text-neutral-400 underline">
          다시 하기
        </Link>
      </div>
    </>
  )
}

export default function ResultPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-10 px-4 py-12">
      {/* useSearchParams를 쓰므로 Suspense 경계가 필요하다. */}
      <Suspense fallback={<p className="py-20 text-center text-neutral-500">불러오는 중…</p>}>
        <Result />
      </Suspense>
    </main>
  )
}
