/**
 * canvas에 그릴 한글 문장을 폭에 맞춰 줄로 나눈다.
 *
 * `fillText`는 자동 줄바꿈을 안 해주므로 직접 잘라야 한다. 한글은 어절 중간에서
 * 끊으면 "뒤집힙니다."가 "뒤집힙 / 니다."가 되므로 **공백 단위로만 자른다.**
 * 브라우저에서 `break-keep`으로 잡은 것과 같은 규칙이다.
 *
 * 한 어절이 폭보다 길면 그 줄은 넘치게 둔다. 억지로 쪼개면 읽기가 더 나쁘고,
 * 제목이 아니라 설명문이라 그런 어절이 사실상 없다.
 *
 * @param measure 글자 폭을 재는 함수. canvas의 `measureText().width`를 넘긴다.
 *   주입받는 이유는 노드에서 테스트하기 위해서다.
 */
export function wrapText(
  text: string,
  maxWidth: number,
  measure: (text: string) => number,
): string[] {
  const words = text.split(' ').filter((w) => w !== '')
  if (words.length === 0) return []

  const lines: string[] = []
  let current = words[0]

  for (const word of words.slice(1)) {
    const candidate = `${current} ${word}`
    if (measure(candidate) <= maxWidth) current = candidate
    else {
      lines.push(current)
      current = word
    }
  }
  lines.push(current)
  return lines
}
