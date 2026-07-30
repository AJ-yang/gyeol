'use client'

import { useState } from 'react'
import type { Work } from '@/lib/types'

export function PosterCard({
  work,
  onPick,
  onSkip,
}: {
  work: Work
  onPick: () => void
  onSkip: () => void
}) {
  const [failed, setFailed] = useState(false)

  // 크기는 부모 그리드 셀이 정한다. 모바일은 위아래 2행, 데스크톱은 좌우 2열이 되고
  // 포스터는 object-cover로 셀을 채운다.
  //
  // 루트를 button으로 두면 "몰라요"를 그 안에 넣을 수 없다 — 버튼 중첩은 HTML 위반이고
  // 클릭이 겹친다. 선택 영역과 몰라요를 형제 button 둘로 나눈다. 루트에 overflow-hidden을
  // 걸지 않는 이유는 걸면 선택 영역의 ring이 잘려서 안 보이기 때문이다.
  return (
    <div className="relative h-full w-full">
      <button
        onClick={onPick}
        className="absolute inset-0 flex items-end overflow-hidden rounded-2xl bg-neutral-800 text-left transition hover:ring-4 hover:ring-white/60 focus:outline-none focus:ring-4 focus:ring-white/60"
      >
        {failed ? (
          <span className="flex h-full w-full items-center justify-center p-4 text-center text-2xl font-bold text-white">
            {work.title}
          </span>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://image.tmdb.org/t/p/w500${work.poster}`}
              alt={work.title}
              onError={() => setFailed(true)}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <span className="relative w-full bg-gradient-to-t from-black via-black/70 to-transparent p-4 pt-10 text-lg font-bold text-white">
              {work.title}
              <span className="ml-2 text-sm font-normal opacity-70">{work.year}</span>
            </span>
          </>
        )}
      </button>

      {/* 두 카드의 라벨이 똑같으므로 aria-label에 제목을 넣어 스크린리더가 구별하게 한다. */}
      <button
        onClick={onSkip}
        aria-label={`${work.title} 몰라요`}
        className="absolute right-2 top-2 z-10 rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition hover:bg-black focus:outline-none focus:ring-2 focus:ring-white/80"
      >
        몰라요
      </button>
    </div>
  )
}
