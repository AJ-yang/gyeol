import type { Axes, Work } from '../types'

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
