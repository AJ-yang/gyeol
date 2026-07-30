import { AXIS_LETTERS, type Axes, type Choice, type Work } from './types'

export type Scores = {
  /** 축별 -1..+1 정규화 점수. 부호가 글자를, 절댓값이 막대 길이를 정한다. */
  norm: Axes
  code: string
}

export function score(pool: Work[], choices: Choice[]): Scores {
  const theta = [0, 0, 0, 0]
  const denom = [0, 0, 0, 0]

  for (const choice of choices) {
    const winner = pool[choice.winner].axes
    const loser = pool[choice.loser].axes
    for (let a = 0; a < 4; a++) {
      theta[a] += winner[a] - loser[a]
      denom[a] += Math.abs(winner[a] - loser[a])
    }
  }

  const norm = theta.map((t, a) => t / Math.max(denom[a], 1)) as Axes
  const code = norm.map((n, a) => AXIS_LETTERS[a][n < 0 ? 0 : 1]).join('')
  return { norm, code }
}

export function oppositeCode(code: string): string {
  return flip(code, [0, 1, 2, 3])
}

export function compatibleCode(code: string): string {
  return flip(code, [0, 1, 3])
}

function flip(code: string, axes: readonly number[]): string {
  return code
    .split('')
    .map((ch, a) => {
      if (!axes.includes(a)) return ch
      const [neg, pos] = AXIS_LETTERS[a]
      return ch === neg ? pos : neg
    })
    .join('')
}
