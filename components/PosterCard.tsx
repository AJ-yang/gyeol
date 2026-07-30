'use client'

import { useState } from 'react'
import type { Work } from '@/lib/types'

export function PosterCard({ work, onPick }: { work: Work; onPick: () => void }) {
  const [failed, setFailed] = useState(false)

  return (
    <button
      onClick={onPick}
      // 크기는 부모 그리드 셀이 정한다. 모바일은 위아래 2행, 데스크톱은 좌우 2열이 되고
      // 포스터는 object-cover로 셀을 채운다.
      className="relative flex h-full w-full items-end overflow-hidden rounded-2xl bg-neutral-800 text-left transition hover:ring-4 hover:ring-white/60 focus:outline-none focus:ring-4 focus:ring-white/60"
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
  )
}
