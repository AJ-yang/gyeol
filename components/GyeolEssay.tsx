'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { neighbourHref, type ReturnTo } from '@/lib/gyeol/back-link'
import { GYEOL_TYPES } from '@/data/gyeol-types'
import type { Gyeol } from '@/lib/gyeol/types'

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

/** 결마다 가까운 결 id 목록. 빌드 때 구워둔 `public/nearby.json`이다. */
type NearbyMap = Record<string, string[]>

/** 한 번 받으면 다시 받지 않는다. 1KB지만 접었다 펼 때마다 요청할 이유가 없다. */
let cached: Promise<NearbyMap> | null = null

function loadNearby(): Promise<NearbyMap> {
  cached ??= fetch(`${BASE}/nearby.json`)
    .then((response) => {
      if (!response.ok) throw new Error(String(response.status))
      return response.json() as Promise<NearbyMap>
    })
    .catch(() => {
      // 실패를 캐시에 남기면 다시 펼쳐도 영영 안 뜬다.
      cached = null
      return {} as NearbyMap
    })
  return cached
}

function tone(hue: number, lightness: number): string {
  return `hsl(${hue}, 72%, ${lightness}%)`
}

/**
 * 결 해설. 더 자세히 보고 싶은 사람을 위한 부분이다.
 *
 * 결과 화면에서는 접어 둔다. 결과를 확인하러 온 사람에게 긴 글을 먼저 내밀면
 * 추천과 공유 버튼이 화면 밖으로 밀리기 때문이다. 결 소개 페이지(`?p=` 없이
 * 들어온 경우)에서는 그 글이 본문이므로 처음부터 펼쳐 둔다.
 */
export function GyeolEssay({
  gyeol,
  open: initiallyOpen = false,
  back = null,
}: {
  gyeol: Gyeol
  open?: boolean
  /** 이웃 결로 넘어가도 잃지 않을 원래 결과. 이웃 링크에 실어 보낸다 */
  back?: ReturnTo | null
}) {
  const [open, setOpen] = useState(initiallyOpen)
  const [nearby, setNearby] = useState<Gyeol[]>([])

  useEffect(() => {
    if (!open) return
    let alive = true
    loadNearby().then((map) => {
      if (!alive) return
      const ids = map[gyeol.id] ?? []
      setNearby(ids.map((id) => GYEOL_TYPES.find((g) => g.id === id)).filter((g) => g !== undefined))
    })
    return () => {
      alive = false
    }
  }, [open, gyeol.id])

  return (
    <section className="rounded-2xl bg-white/[0.04] p-5">
      {!initiallyOpen && (
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <span className="break-keep font-bold">이 결에 대해 더 읽기</span>
          <span aria-hidden className="shrink-0 text-neutral-500">
            {open ? '접기' : '펼치기'}
          </span>
        </button>
      )}

      {open && (
        <div className={initiallyOpen ? '' : 'mt-5'}>
          {gyeol.essay.map((paragraph) => (
            <p key={paragraph} className="mb-3 break-keep leading-relaxed text-neutral-300">
              {paragraph}
            </p>
          ))}

          <h3 className="mt-6 mb-3 text-sm font-bold text-neutral-400">이런 순간에 반응해요</h3>
          <ul className="space-y-2">
            {gyeol.signs.map((sign) => (
              <li key={sign} className="flex gap-2.5 break-keep text-sm text-neutral-300">
                <span aria-hidden style={{ color: tone(gyeol.hue, 68) }}>
                  ·
                </span>
                {sign}
              </li>
            ))}
          </ul>

          {nearby.length > 0 && (
            <>
              <h3 className="mt-6 mb-3 text-sm font-bold text-neutral-400">가까운 결</h3>
              <div className="flex flex-wrap gap-2">
                {nearby.map((other) => (
                  <Link
                    key={other.id}
                    href={neighbourHref(other.id, back)}
                    className="rounded-full px-3.5 py-2 text-sm break-keep transition hover:brightness-125"
                    style={{ backgroundColor: `hsla(${other.hue}, 72%, 30%, 1)` }}
                  >
                    {other.emoji} {other.name}
                  </Link>
                ))}
              </div>
              {/* 가까움은 손으로 정한 것이 아니라 카탈로그에서 함께 걸린 횟수다. */}
              <p className="mt-3 break-keep text-xs text-neutral-600">
                같은 작품이 두 결에 함께 걸린 횟수로 골랐어요
              </p>
            </>
          )}
        </div>
      )}
    </section>
  )
}
