import { describe, expect, it } from 'vitest'
import { wrapText } from './wrap-text'

/** 글자 하나를 10px로 치는 가짜 측정기. 실제 폰트 없이 규칙만 검증한다. */
const measure = (text: string) => text.length * 10

describe('wrapText', () => {
  it('폭에 들어가면 한 줄로 둔다', () => {
    expect(wrapText('가나다', 100, measure)).toEqual(['가나다'])
  })

  it('폭을 넘으면 나눈다', () => {
    expect(wrapText('가나다 라마바 사아자', 60, measure)).toEqual(['가나다', '라마바', '사아자'])
  })

  it('들어가는 만큼 채운 뒤 넘긴다', () => {
    // "가나 다라"(50px)까지는 100에 들어가고 "마바사"를 붙이면 90px라 아직 들어간다.
    // 하나 더 붙어 넘칠 때 비로소 줄이 나뉜다.
    expect(wrapText('가나 다라 마바사', 100, measure)).toEqual(['가나 다라 마바사'])
    expect(wrapText('가나 다라 마바사 아자차', 100, measure)).toEqual(['가나 다라 마바사', '아자차'])
  })

  it('어절 중간을 자르지 않는다', () => {
    // 한글은 어절 중간에서 끊으면 "뒤집힙 / 니다."가 된다
    const lines = wrapText('세상이 뒤집힙니다', 60, measure)
    for (const line of lines) expect(line).not.toMatch(/^니다/)
    expect(lines).toEqual(['세상이', '뒤집힙니다'])
  })

  it('폭보다 긴 어절은 넘치게 둔다', () => {
    // 억지로 쪼개면 읽기가 더 나쁘다. 던지지만 않으면 된다.
    expect(wrapText('아주아주아주긴어절', 30, measure)).toEqual(['아주아주아주긴어절'])
  })

  it('빈 문자열에 빈 배열을 낸다', () => {
    expect(wrapText('', 100, measure)).toEqual([])
    expect(wrapText('   ', 100, measure)).toEqual([])
  })

  it('연속된 공백을 하나로 친다', () => {
    expect(wrapText('가나  다라', 100, measure)).toEqual(['가나 다라'])
  })

  it('모든 줄이 원문의 어절 순서를 지킨다', () => {
    const text = '소리치는 분노를 믿지 않습니다 참던 사람이 마침내 움직이는'
    const joined = wrapText(text, 120, measure).join(' ')
    expect(joined).toBe(text)
  })
})
