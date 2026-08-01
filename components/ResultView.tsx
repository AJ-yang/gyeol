'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { GyeolBanner } from '@/components/GyeolBanner'
import { ShareCardButton } from '@/components/ShareCardButton'
import { WorkDetailSheet } from '@/components/WorkDetailSheet'
import { GYEOL_TYPES } from '@/data/gyeol-types'
import { breakdown } from '@/lib/gyeol/breakdown'
import { recommendationSources } from '@/lib/gyeol/details'
import { matchGyeol } from '@/lib/gyeol/match'
import { decodePicks } from '@/lib/gyeol/payload'
import { recommend } from '@/lib/gyeol/recommend'
import { useCatalog, useRecommendations } from '@/lib/gyeol/use-catalog'
import { workKey, type CatalogEntry } from '@/lib/gyeol/types'

const RECOMMEND_COUNT = 10

/**
 * 포스터 한 장. 누르면 상세가 열린다.
 *
 * 제목이 포스터 안에만 있어 작은 화면에서는 읽기 어렵다. `title`을 달아
 * 데스크톱에서는 올려두면 뜨게 하고, 스크린리더도 무엇인지 알 수 있게 한다.
 */
function Poster({ work, onOpen }: { work: CatalogEntry; onOpen: (work: CatalogEntry) => void }) {
  return (
    <button
      onClick={() => onOpen(work)}
      title={work.t}
      aria-label={`${work.t} 정보 보기`}
      className="overflow-hidden rounded-md transition hover:opacity-80 focus:ring-2 focus:ring-white/60 focus:outline-none"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://image.tmdb.org/t/p/w185/${work.p}`}
        alt={work.t}
        className="aspect-[2/3] w-full bg-neutral-800 object-cover"
      />
    </button>
  )
}

/**
 * 결과 화면 본문.
 *
 * `/result/?p=`와 결별 정적 페이지(`/r/<결 id>/?p=`)가 함께 쓴다. 후자는 공유
 * 링크의 미리보기를 결마다 다르게 하려고 존재한다 — 정적 배포라 질의 문자열로는
 * og 태그를 바꿀 수 없어서, 결 수만큼 페이지를 미리 구워야 한다.
 *
 * @param gyeolId 이 페이지가 대표하는 결. `?p=`가 없을 때 무엇을 보여줄지에만
 *   쓰인다. 본문의 진짜 근거는 언제나 `?p=`에 담긴 선택이다.
 */
export function ResultView({ gyeolId }: { gyeolId?: string }) {
  const params = useSearchParams()
  const payload = params.get('p')
  const { catalog } = useCatalog()
  const recommendations = useRecommendations(catalog !== null)
  const [open, setOpen] = useState<CatalogEntry | null>(null)

  const state = useMemo(() => {
    // 선택 없이 들어온 경우. 친구가 공유한 링크의 미리보기만 보고 눌렀거나
    // 결 소개를 직접 연 상황이라, 그 결이 무엇인지 보여주고 초대한다.
    if (payload === null) return { landing: true as const }
    if (!catalog) return null
    const refs = decodePicks(payload)
    if (refs === null) return { broken: true as const }

    const byKey = new Map(catalog.works.map((w) => [workKey(w), w]))
    const picks = refs.map((r) => byKey.get(workKey(r))).filter((w) => w !== undefined)
    if (picks.length === 0) return { broken: true as const }

    const scores = matchGyeol(picks, catalog, GYEOL_TYPES)
    const gyeol = GYEOL_TYPES.find((g) => g.id === scores[0].id)!
    // 공유 카드에 들어갈 상위 3개. 1위만 보여주면 견줄 것이 없다.
    return { broken: false as const, gyeol, picks, rows: breakdown(scores, GYEOL_TYPES, 3) }
  }, [catalog, payload])

  if (!state) {
    return <p className="animate-pulse py-20 text-center text-neutral-500">결을 읽는 중…</p>
  }

  if ('landing' in state) {
    const gyeol = GYEOL_TYPES.find((g) => g.id === gyeolId)
    if (gyeol === undefined) {
      return (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <p className="break-keep text-neutral-300">결과를 읽을 수 없는 주소예요.</p>
          <Link href="/pick/" className="rounded-full bg-white px-6 py-3 font-bold text-black">
            처음부터 해보기
          </Link>
        </div>
      )
    }
    return (
      <>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[70vh]"
          style={{
            background: `linear-gradient(to bottom, hsla(${gyeol.hue}, 72%, 22%, 1), hsla(${gyeol.hue}, 72%, 8%, 0.6) 55%, transparent)`,
          }}
        />
        <GyeolBanner gyeol={gyeol} rows={[]} />
        <div className="flex flex-col items-center gap-3">
          <Link
            href="/pick/"
            className="rounded-full bg-white px-7 py-3.5 font-bold text-black"
          >
            나는 무슨 결일까?
          </Link>
          <p className="break-keep text-sm text-neutral-500">1분이면 나와요</p>
        </div>
      </>
    )
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
  const pickedKeys = new Set(state.picks.map(workKey))

  return (
    <>
      {/*
        결 고유색을 화면 위에서 은은하게 깐다. 카드와 같은 색이라야 카드를
        받고 링크를 타고 온 사람이 이어진 것으로 읽는다. 내용 뒤에 깔리도록
        음수 z-index를 주고 클릭을 막지 않는다.

        `fixed`가 아니라 `absolute`다. 고정하면 아래로 스크롤해도 색이 뷰포트
        위쪽에 계속 붙어 있어, 포스터 목록을 보는 내내 따라다닌다. 이 색은
        머리에 속한 것이라 내용과 함께 밀려나야 한다.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[70vh]"
        style={{
          background: `linear-gradient(to bottom, hsla(${state.gyeol.hue}, 72%, 22%, 1), hsla(${state.gyeol.hue}, 72%, 8%, 0.6) 55%, transparent)`,
        }}
      />

      <GyeolBanner gyeol={state.gyeol} rows={state.rows} />

      <section>
        <h2 className="mb-3 text-sm font-bold text-neutral-400">당신이 고른 {state.picks.length}편</h2>
        <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-8">
          {state.picks.map((work) => (
            <Poster key={workKey(work)} work={work} onOpen={setOpen} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-sm font-bold text-neutral-400">이런 것도 좋아할 거예요</h2>
        <p className="mb-3 break-keep text-xs text-neutral-600">포스터를 누르면 줄거리를 볼 수 있어요</p>
        {recommendations === null ? (
          <p className="text-sm text-neutral-600">추천을 불러오는 중…</p>
        ) : picked.length === 0 ? (
          <p className="break-keep text-sm text-neutral-600">고른 작품이 적어 추천할 것을 찾지 못했어요.</p>
        ) : (
          <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-10">
            {picked.map((work) => (
              <Poster key={workKey(work)} work={work} onOpen={setOpen} />
            ))}
          </div>
        )}
      </section>

      {/*
        공유가 이 서비스가 퍼지는 유일한 경로라 결과 바로 아래, 다시 하기보다
        위에 둔다. 카드에는 고른 작품의 포스터가 들어간다.
      */}
      <div className="flex flex-col items-center gap-5">
        <ShareCardButton gyeol={state.gyeol} rows={state.rows} picks={state.picks} />
        <Link href="/pick/" className="text-sm text-neutral-400 underline">
          다시 하기
        </Link>
      </div>

      {/*
        추천 근거는 추천된 작품에만 붙인다. 고른 작품에 "고른 X와 닿아
        있어요"가 뜨면 말이 안 된다.
      */}
      <WorkDetailSheet
        work={open}
        sources={
          open !== null && !pickedKeys.has(workKey(open))
            ? recommendationSources(open, state.picks, recommendations ?? {})
            : []
        }
        onClose={() => setOpen(null)}
      />
    </>
  )
}
