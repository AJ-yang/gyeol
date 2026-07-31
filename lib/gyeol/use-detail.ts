'use client'

import { useEffect, useState } from 'react'
import { detailChunk, detailChunkPath, type DetailChunk, type WorkDetail } from './details'
import { workKey, type CatalogEntry } from './types'

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

/**
 * 이미 받은 청크. 모듈 수준에 두어 모달을 닫았다 열어도 다시 받지 않는다.
 *
 * 값이 아니라 Promise를 담는다. 같은 청크를 동시에 두 번 열면 요청도 두 번
 * 나가는데, Promise를 담아두면 뒤엣것이 앞엣것을 기다린다.
 */
const cache = new Map<number, Promise<DetailChunk>>()

function loadChunk(chunk: number): Promise<DetailChunk> {
  const cached = cache.get(chunk)
  if (cached) return cached

  const request = fetch(`${BASE}/${detailChunkPath(chunk)}`)
    .then((response) => {
      if (!response.ok) throw new Error(`청크 ${chunk}: ${response.status}`)
      return response.json() as Promise<DetailChunk>
    })
    .catch(() => {
      // 실패한 것을 캐시에 남기면 다시 눌러도 영영 안 뜬다.
      cache.delete(chunk)
      return {} as DetailChunk
    })

  cache.set(chunk, request)
  return request
}

/** 받아둔 결과. 어느 작품 것인지 같이 들고 있어야 이전 작품의 줄거리가 안 샌다. */
type Loaded = { key: string; detail: WorkDetail | null }

/**
 * 작품 상세를 받는다. `work`가 null이면 아무것도 하지 않는다.
 *
 * 상세는 눌렀을 때만 필요하므로 첫 로딩에 얹지 않는다. 전체가 수 MB라
 * 얹으면 시작이 그만큼 느려진다.
 *
 * 받은 값을 키와 함께 담고 화면에 쓸 값은 파생시킨다. 작품이 바뀔 때마다
 * 효과 본문에서 `setDetail(null)`로 지우면 렌더가 한 번 더 돌고, 지우기 전
 * 한 프레임 동안 **이전 작품의 줄거리가 새 작품 제목 아래 보인다.**
 */
export function useDetail(work: CatalogEntry | null) {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const key = work === null ? null : workKey(work)

  useEffect(() => {
    if (work === null || key === null) return
    let alive = true
    loadChunk(detailChunk(work)).then((chunk) => {
      if (alive) setLoaded({ key, detail: chunk[key] ?? null })
    })
    return () => {
      alive = false
    }
    // work 객체는 렌더마다 새로 만들어질 수 있으므로 키로만 비교한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const fresh = key !== null && loaded?.key === key
  return { detail: fresh ? loaded.detail : null, loading: key !== null && !fresh }
}
