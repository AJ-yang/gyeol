import type { Axes, Work } from '../types'

function work(id: number, axes: Axes): Work {
  return {
    id,
    media: 'movie',
    title: `T${axes.join('')}`,
    year: 2000,
    poster: '/p.jpg',
    axes,
    labeledAt: '2026-07-30',
  }
}

/**
 * 축 값이 -1..+1로만 이루어져 `gap >= 3`인 쌍이 존재할 수 없는 풀.
 * 선택기의 완화 단계(MIN_GAPS의 두 번째 티어)가 실제로 동작하는지 검증한다.
 * 조밀한 makeTestPool로는 1단계에서 항상 완벽한 쌍이 잡혀 완화 경로가 죽은 코드가 된다.
 */
export function makeSparsePool(): Work[] {
  const works: Work[] = []
  let id = 1
  for (const c of [-1, 0, 1]) {
    for (const a of [-1, 0, 1]) {
      for (const t of [-1, 0, 1]) {
        for (const w of [-1, 0, 1]) {
          works.push(work(id++, [c, a, t, w]))
        }
      }
    }
  }
  return works
}

export function makeTestPool(): Work[] {
  const works: Work[] = []
  let id = 1
  for (const c of [-2, -1, 0, 1, 2]) {
    for (const a of [-2, -1, 0, 1, 2]) {
      for (const t of [-2, 0, 2]) {
        for (const w of [-2, 0, 2]) {
          works.push({
            id: id++,
            media: 'movie',
            title: `T${c}${a}${t}${w}`,
            year: 2000,
            poster: '/p.jpg',
            axes: [c, a, t, w] as Axes,
            labeledAt: '2026-07-30',
          })
        }
      }
    }
  }
  return works
}
