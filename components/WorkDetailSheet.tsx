'use client'

import { useEffect } from 'react'
import { useDetail } from '@/lib/gyeol/use-detail'
import { GENRE_LABELS, type CatalogEntry } from '@/lib/gyeol/types'

/** 분을 "2시간 12분"으로 읽는다. 132분보다 길이가 바로 와닿는다. */
function runtimeLabel(minutes: number): string {
  if (minutes <= 0) return ''
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest}분`
  return rest === 0 ? `${hours}시간` : `${hours}시간 ${rest}분`
}

/**
 * 작품 하나를 눌렀을 때 뜨는 정보 시트.
 *
 * 추천을 받아도 모르는 작품이면 볼지 말지 정할 수가 없다. 줄거리와 평점이
 * 그 판단을 위한 최소한이다. 줄거리는 첫 로딩에 얹기엔 너무 커서(전체 수 MB)
 * 누른 시점에 해당 청크만 받는다.
 *
 * 모바일에서 아래에서 올라오는 형태로 둔다. 결과 페이지가 세로로 길어
 * 가운데 모달은 스크롤 위치에 따라 화면 밖에 뜰 수 있다.
 */
export function WorkDetailSheet({
  work,
  sources,
  onClose,
}: {
  work: CatalogEntry | null
  /** 이 작품을 추천하게 만든, 사용자가 고른 작품들 */
  sources: CatalogEntry[]
  onClose: () => void
}) {
  const { detail, loading } = useDetail(work)

  // 열려 있는 동안 Esc로 닫고, 뒤 화면이 같이 스크롤되지 않게 막는다.
  useEffect(() => {
    if (work === null) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [work, onClose])

  if (work === null) return null

  const genres = work.g.map((index) => GENRE_LABELS[index]).filter(Boolean)
  const runtime = runtimeLabel(detail?.r ?? 0)
  const tmdbUrl = `https://www.themoviedb.org/${work.m === 0 ? 'movie' : 'tv'}/${work.i}`

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-neutral-900 p-5 sm:rounded-3xl"
      >
        <div className="flex gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://image.tmdb.org/t/p/w185/${work.p}`}
            alt={work.t}
            className="h-36 w-24 shrink-0 rounded-lg bg-neutral-800 object-cover"
          />
          <div className="min-w-0 flex-1">
            <h3 className="break-keep text-lg font-bold leading-snug">{work.t}</h3>
            <p className="mt-1.5 text-sm text-neutral-400">
              {[work.y > 0 ? work.y : null, work.m === 0 ? '영화' : '드라마', runtime]
                .filter(Boolean)
                .join(' · ')}
            </p>
            {detail !== null && detail.v > 0 && (
              <p className="mt-1 text-sm text-neutral-400">
                <span className="text-yellow-400">★</span> {detail.v.toFixed(1)}
                {detail.s ? ` · 시즌 ${detail.s}개` : ''}
              </p>
            )}
            {genres.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {genres.map((genre) => (
                  <span
                    key={genre}
                    className="rounded-full bg-neutral-800 px-2.5 py-1 text-xs text-neutral-300"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 min-h-16">
          {loading ? (
            <p className="animate-pulse text-sm text-neutral-500">줄거리를 불러오는 중…</p>
          ) : detail?.o ? (
            <p className="break-keep text-sm leading-relaxed text-neutral-300">{detail.o}</p>
          ) : (
            <p className="break-keep text-sm text-neutral-500">줄거리가 등록되어 있지 않아요.</p>
          )}
        </div>

        {/*
          왜 이게 떴는지 알려준다. 근거 없는 추천은 안 믿게 된다.

          "「제목」과 닿아 있어요"처럼 조사를 붙이지 않는다. 와/과는 앞말의
          받침에 따라 갈리는데 제목은 한글·영문·숫자로 다 끝나서(「침입자」는
          "와", 「기생충」은 "과") 규칙을 넣어도 계속 틀린다. 조사가 변하지
          않는 "에서 이어졌어요"로 쓴다.
        */}
        {sources.length > 0 && (
          <p className="mt-4 break-keep rounded-xl bg-neutral-800/60 px-3.5 py-3 text-sm text-neutral-300">
            고른 「{sources[0].t}」
            {sources.length > 1 ? ` 외 ${sources.length - 1}편` : ''}에서 이어졌어요
          </p>
        )}

        <div className="mt-5 flex items-center gap-3">
          <a
            href={tmdbUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-1 rounded-full bg-neutral-800 py-3 text-center text-sm font-bold text-neutral-200"
          >
            TMDB에서 보기
          </a>
          <button
            onClick={onClose}
            className="flex-1 rounded-full bg-white py-3 text-sm font-bold text-black"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
