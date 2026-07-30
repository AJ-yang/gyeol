'use client'

import { useState } from 'react'

export function ShareButton() {
  const [copied, setCopied] = useState(false)

  async function share() {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ url })
        return
      } catch {
        // 사용자가 공유 시트를 닫은 경우 — 클립보드로 폴백한다.
      }
    }
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={share}
      className="rounded-full bg-white px-6 py-3 font-bold text-black transition hover:bg-neutral-200"
    >
      {copied ? '링크 복사됨' : '결과 공유하기'}
    </button>
  )
}
