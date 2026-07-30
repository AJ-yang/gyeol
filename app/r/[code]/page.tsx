import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ResultDetails } from '@/components/ResultDetails'
import { ShareButton } from '@/components/ShareButton'
import { STORY_TYPES } from '@/data/story-types'
import { compatibleCode, oppositeCode } from '@/lib/scoring'

/** 정적 배포이므로 16개 유형 페이지를 빌드 시점에 모두 만든다. */
export function generateStaticParams() {
  return Object.keys(STORY_TYPES).map((code) => ({ code }))
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

export default async function ResultPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const type = STORY_TYPES[code]
  if (!type) notFound()

  const opposite = STORY_TYPES[oppositeCode(code)]
  const compatible = STORY_TYPES[compatibleCode(code)]

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-10 px-4 py-12">
      <header className="text-center">
        <p className="text-6xl font-black tracking-tight">{code}</p>
        <h1 className="mt-3 text-3xl font-bold">{type.name}</h1>
        <p className="mx-auto mt-4 max-w-md leading-relaxed text-neutral-300">{type.description}</p>
      </header>

      {/* useSearchParams를 쓰므로 Suspense 경계가 필요하다. */}
      <Suspense fallback={<div className="h-40" />}>
        <ResultDetails code={code} />
      </Suspense>

      <section className="grid grid-cols-2 gap-3 text-center">
        <div className="rounded-xl bg-neutral-900 p-4">
          <p className="text-xs text-neutral-500">잘 맞는 유형</p>
          <p className="mt-1 font-bold">{compatible.name}</p>
          <p className="text-sm text-neutral-500">{compatibleCode(code)}</p>
        </div>
        <div className="rounded-xl bg-neutral-900 p-4">
          <p className="text-xs text-neutral-500">상극 유형</p>
          <p className="mt-1 font-bold">{opposite.name}</p>
          <p className="text-sm text-neutral-500">{oppositeCode(code)}</p>
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
