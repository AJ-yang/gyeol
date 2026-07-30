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

/**
 * 코드를 검증한 뒤 지정한 축의 글자를 뒤집는다.
 *
 * 검증하는 이유: 코드는 `/r/[code]` 경로에서 오는 사용자 입력이다. 검증 없이
 * `ch === neg ? pos : neg`만 쓰면 소문자 URL 같은 비정상 입력이 전부 첫 글자로 접혀
 * 그럴듯하지만 완전히 틀린 상극 유형을 조용히 내놓는다.
 */
function flip(code: string, axes: readonly number[]): string {
  if (code.length !== AXIS_LETTERS.length) throw new Error(`invalid type code: ${code}`)

  return code
    .split('')
    .map((ch, a) => {
      const [neg, pos] = AXIS_LETTERS[a]
      if (ch !== neg && ch !== pos) throw new Error(`invalid type code: ${code}`)
      if (!axes.includes(a)) return ch
      return ch === neg ? pos : neg
    })
    .join('')
}
