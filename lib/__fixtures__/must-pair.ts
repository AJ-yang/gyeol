import { nextPair, type Pair } from '../selector'
import type { Choice, Work } from '../types'

/**
 * `nextPair`의 `null`을 그 자리에서 실패로 바꾼다.
 *
 * `nextPair`는 제외가 쌓여 후보가 마르면 `null`을 내는데, 대부분의 테스트는 그 상황에
 * 도달하지 않는다. 호출 지점마다 `!`를 흩뿌리면 정말로 `null`이 나오기 시작한 순간을
 * 놓치므로, 여기서 원인이 적힌 에러로 바꿔 던진다. 고갈 자체는 `nextPair`를 직접
 * 호출하는 별도 테스트에서 검증한다.
 */
export function mustPair(
  pool: Work[],
  choices: Choice[],
  seed: number,
  excluded: ReadonlySet<number> = new Set<number>(),
): Pair {
  const pair = nextPair(pool, choices, seed, excluded)
  if (pair === null) {
    throw new Error(`nextPair가 null을 반환했다 (라운드 ${choices.length}, 제외 ${excluded.size}개)`)
  }
  return pair
}
