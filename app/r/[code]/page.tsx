import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AxisBars } from '@/components/AxisBars'
import { ShareButton } from '@/components/ShareButton'
import { STORY_TYPES } from '@/data/story-types'
import worksData from '@/data/works.json'
import { decodeChoices } from '@/lib/payload'
import { compatibleCode, oppositeCode, score } from '@/lib/scoring'
import type { Work } from '@/lib/types'

const POOL = worksData as Work[]

type PageProps = {
  params: Promise<{ code: string }>
  searchParams: Promise<{ p?: string | string[] }>
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const type = STORY_TYPES[code]
  if (!type) return { title: 'Story Compass' }
  return {
    title: `${code} · ${type.name} | Story Compass`,
    description: type.description,
  }
}

export default async function ResultPage({ params, searchParams }: PageProps) {
  const { code } = await params
  const { p } = await searchParams
  const payload = typeof p === 'string' ? p : undefined

  const choices = payload ? decodeChoices(payload, POOL.length) : null
  if (!choices) redirect('/')

  const result = score(POOL, choices)
  // 경로의 코드는 사용자가 고칠 수 있다. 재계산한 코드로 정규화한 뒤에만 유형을 조회한다.
  if (result.code !== code) redirect(`/r/${result.code}?p=${payload}`)

  const type = STORY_TYPES[result.code]
  const opposite = STORY_TYPES[oppositeCode(result.code)]
  const compatible = STORY_TYPES[compatibleCode(result.code)]
  const picked = choices.map((choice) => POOL[choice.winner])

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-10 px-4 py-12">
      <header className="text-center">
        <p className="text-6xl font-black tracking-tight">{result.code}</p>
        <h1 className="mt-3 text-3xl font-bold">{type.name}</h1>
        <p className="mx-auto mt-4 max-w-md leading-relaxed text-neutral-300">{type.description}</p>
      </header>

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

      <section className="grid grid-cols-2 gap-3 text-center">
        <div className="rounded-xl bg-neutral-900 p-4">
          <p className="text-xs text-neutral-500">잘 맞는 유형</p>
          <p className="mt-1 font-bold">{compatible.name}</p>
          <p className="text-sm text-neutral-500">{compatibleCode(result.code)}</p>
        </div>
        <div className="rounded-xl bg-neutral-900 p-4">
          <p className="text-xs text-neutral-500">상극 유형</p>
          <p className="mt-1 font-bold">{opposite.name}</p>
          <p className="text-sm text-neutral-500">{oppositeCode(result.code)}</p>
        </div>
      </section>

      <div className="flex flex-col items-center gap-3">
        <ShareButton />
        <Link href="/play" className="text-sm text-neutral-400 underline">
          다시 하기
        </Link>
      </div>
    </main>
  )
}
