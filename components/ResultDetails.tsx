'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AxisBars } from '@/components/AxisBars'
import worksData from '@/data/works.json'
import { decodeChoices } from '@/lib/payload'
import { score } from '@/lib/scoring'
import type { Work } from '@/lib/types'

const POOL = worksData as Work[]

/**
 * 축 막대와 고른 작품들은 선택 기록에 따라 달라지므로 정적으로 만들 수 없다.
 * 정적 배포에서는 프리렌더 시점에 `?p=`를 알 수 없어, 클라이언트에서 URL을 읽어 그린다.
 * 코드에서 바로 나오는 유형 이름·설명·상극/궁합은 부모 서버 컴포넌트가 정적으로 렌더한다.
 */
export function ResultDetails({ code }: { code: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const payload = searchParams.get('p')

  const choices = payload ? decodeChoices(payload, POOL.length) : null
  const result = choices ? score(POOL, choices) : null

  useEffect(() => {
    // 프리렌더 결과가 잠깐 보이는 동안에는 아무것도 하지 않는다.
    if (payload === null) return

    const decoded = decodeChoices(payload, POOL.length)
    if (!decoded) {
      router.replace('/')
      return
    }
    // 경로의 코드는 사용자가 고칠 수 있다. 선택 기록으로 다시 계산한 코드가 정답이다.
    const recomputed = score(POOL, decoded).code
    if (recomputed !== code) router.replace(`/r/${recomputed}/?p=${payload}`)
  }, [payload, code, router])

  if (!result || !choices) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-2 animate-pulse rounded-full bg-neutral-900" />
        <div className="h-2 animate-pulse rounded-full bg-neutral-900" />
        <div className="h-2 animate-pulse rounded-full bg-neutral-900" />
        <div className="h-2 animate-pulse rounded-full bg-neutral-900" />
      </div>
    )
  }

  const picked = choices.map((choice) => POOL[choice.winner])

  return (
    <>
      <AxisBars norm={result.norm} />

      <section>
        <h2 className="mb-3 text-sm font-bold text-neutral-400">당신이 고른 12편</h2>
        <div className="grid grid-cols-6 gap-1.5">
          {picked.map((work, index) => (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={`${work.media}-${work.id}-${index}`}
              src={`https://image.tmdb.org/t/p/w185${work.poster}`}
              alt={work.title}
              title={work.title}
              className="aspect-[2/3] w-full rounded-md bg-neutral-800 object-cover"
            />
          ))}
        </div>
      </section>
    </>
  )
}
