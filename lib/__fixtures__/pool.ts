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

/**
 * `gap >= 3` 필터가 없으면 선택기가 틀린 쌍을 고르도록 설계된 풀.
 *
 * 세 종류의 작품만 쓴다. A=[-2,0,0,0], B=[-1,1,1,1], C=[1,1,1,1].
 * - A-C: 축 0에서 gap 3, confound 3 → score 3 (필터 통과)
 * - B-C: 축 0에서 gap 2, confound 0 → score 4 (점수는 높지만 격리 실패)
 *
 * 점수만 보면 B-C가 이긴다. 필터가 살아 있어야만 A-C가 선택된다.
 * 조밀한 makeTestPool에서는 최고점 쌍이 이미 gap 4·confound 0이라 필터가 있으나 마나였다.
 *
 * A와 C는 매 라운드 한 개씩 소진되므로 12라운드를 버티도록 14개씩 넣는다.
 * 부족하면 후반 라운드가 완화 단계로 떨어져 필터가 아니라 소진을 테스트하게 된다.
 */
export function makeFilterProbePool(): Work[] {
  const shapes: [Axes, number][] = [
    [[-2, 0, 0, 0], 14],
    [[-1, 1, 1, 1], 4],
    [[1, 1, 1, 1], 14],
  ]
  const works: Work[] = []
  let id = 1
  for (const [axes, count] of shapes) {
    for (let copy = 0; copy < count; copy++) works.push(work(id++, [...axes] as Axes))
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
