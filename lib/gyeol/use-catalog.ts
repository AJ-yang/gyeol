// lib/gyeol/use-catalog.ts
'use client'

import { useEffect, useState } from 'react'
import type { Catalog } from './types'

/**
 * 정적 배포라 basePath가 붙는다. fetch 경로에 직접 붙여야 GitHub Pages에서
 * 404가 나지 않는다. next.config.ts의 basePath와 같은 값이어야 한다.
 */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

async function loadJson<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE}${path}`)
  if (!response.ok) throw new Error(`${path}: ${response.status}`)
  return response.json() as Promise<T>
}

/** 색인을 받는다. 그리드가 이것 없이는 아무것도 못 그린다. */
export function useCatalog() {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    loadJson<Catalog>('/catalog.json')
      .then((data) => alive && setCatalog(data))
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [])

  return { catalog, failed }
}

