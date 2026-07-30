import { ROUNDS, type Choice } from './types'

/**
 * 12쌍의 인덱스를 24바이트로 담아 base64url 32자로 만든다. 풀 크기가 256 미만이라 1바이트면 충분하다.
 *
 * 담는 값이 TMDB id가 아니라 `works.json`의 배열 인덱스이므로, 풀을 갱신할 때 순서를
 * 바꾸거나 중간 항목을 제거하면 이미 공유된 링크가 조용히 다른 작품을 가리킨다.
 * 갱신은 제자리 덮어쓰기와 끝에 추가만 허용한다 (설계 문서 6절).
 */
export function encodeChoices(choices: Choice[]): string {
  let binary = ''
  for (const choice of choices) {
    binary += String.fromCharCode(choice.winner & 0xff, choice.loser & 0xff)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeChoices(payload: string, poolSize: number): Choice[] | null {
  let binary: string
  try {
    binary = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
  } catch {
    return null
  }

  if (binary.length !== ROUNDS * 2) return null

  const choices: Choice[] = []
  for (let i = 0; i < binary.length; i += 2) {
    const winner = binary.charCodeAt(i)
    const loser = binary.charCodeAt(i + 1)
    if (winner >= poolSize || loser >= poolSize || winner === loser) return null
    choices.push({ winner, loser })
  }
  return choices
}
