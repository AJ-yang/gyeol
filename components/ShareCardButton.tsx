'use client'

import { useState } from 'react'
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  MAX_POSTERS,
  drawShareCard,
  loadImage,
  posterUrl,
} from '@/lib/gyeol/share-card'
import type { CatalogEntry } from '@/lib/gyeol/types'

const SITE_URL = 'aj-yang.github.io/gyeol'
const FILE_NAME = 'gyeol.png'

type State = 'idle' | 'working' | 'failed'

/**
 * 결과를 한 장의 이미지로 만들어 공유하거나 내려받는다.
 *
 * 모바일에서 카카오톡으로 바로 보내는 것이 이 기능의 존재 이유이므로
 * `navigator.share`를 먼저 쓴다. 데스크톱은 파일 공유를 지원하지 않으므로
 * 자동으로 다운로드로 떨어진다.
 */
export function ShareCardButton({
  gyeolName,
  description,
  picks,
}: {
  gyeolName: string
  description: string
  picks: CatalogEntry[]
}) {
  const [state, setState] = useState<State>('idle')

  async function makeCard() {
    setState('working')
    try {
      // 못 받은 포스터는 건너뛴다. 한 장 때문에 카드 전체가 실패하면 안 된다.
      const settled = await Promise.allSettled(
        picks.slice(0, MAX_POSTERS).map((work) => loadImage(posterUrl(work))),
      )
      const posters = settled
        .filter((r): r is PromiseFulfilledResult<HTMLImageElement> => r.status === 'fulfilled')
        .map((r) => r.value)

      const canvas = document.createElement('canvas')
      canvas.width = CARD_WIDTH
      canvas.height = CARD_HEIGHT
      const context = canvas.getContext('2d')
      if (!context) throw new Error('canvas 2d 컨텍스트를 못 얻었다')

      drawShareCard(context, { gyeolName, description, posters, siteUrl: SITE_URL })

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
      if (!blob) throw new Error('이미지로 못 바꿨다')

      const file = new File([blob], FILE_NAME, { type: 'image/png' })

      // canShare로 먼저 확인한다. 지원 여부를 안 보고 부르면 데스크톱에서 던진다.
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] })
          setState('idle')
          return
        } catch {
          // 사용자가 공유 시트를 닫은 경우다. 다운로드로 떨어뜨린다.
        }
      }

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = FILE_NAME
      link.click()
      // 곧바로 해제하면 브라우저가 blob을 읽기 전에 무효화되어 다운로드가
      // 취소될 수 있다. 한 틱 뒤로 미룬다.
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
      setState('idle')
    } catch {
      setState('failed')
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={makeCard}
        disabled={state === 'working'}
        className="rounded-full bg-white px-6 py-3 font-bold text-black transition hover:bg-neutral-200 disabled:opacity-50"
      >
        {state === 'working' ? '만드는 중…' : '이미지로 공유하기'}
      </button>
      {state === 'failed' && (
        <p className="break-keep text-sm text-neutral-500">이미지를 만들지 못했어요.</p>
      )}
    </div>
  )
}
