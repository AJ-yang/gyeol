import { describe, expect, it } from 'vitest'
import { STORY_TYPES } from './story-types'
import { AXIS_LETTERS } from '../lib/types'

function allCodes(): string[] {
  let codes = ['']
  for (const [neg, pos] of AXIS_LETTERS) {
    codes = codes.flatMap((prefix) => [prefix + neg, prefix + pos])
  }
  return codes
}

describe('STORY_TYPES', () => {
  it('16개 코드를 모두 덮는다', () => {
    const codes = allCodes()
    expect(codes).toHaveLength(16)
    for (const code of codes) {
      expect(STORY_TYPES[code], `missing ${code}`).toBeDefined()
    }
  })

  it('정의된 코드가 16개를 넘지 않는다', () => {
    expect(Object.keys(STORY_TYPES)).toHaveLength(16)
  })

  it('모든 유형에 이름과 설명이 채워져 있다', () => {
    for (const [code, type] of Object.entries(STORY_TYPES)) {
      expect(type.name.length, code).toBeGreaterThan(0)
      expect(type.description.length, code).toBeGreaterThan(20)
    }
  })

  it('유형 이름이 서로 겹치지 않는다', () => {
    const names = Object.values(STORY_TYPES).map((t) => t.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('설명이 사용자를 2인칭으로 단언하지 않는다', () => {
    // 이 서비스가 재는 것은 어떤 이야기에 끌리는가이지 어떤 사람인가가 아니다.
    // 설명은 작품 속 서사를 묘사해야 하며, 사용자를 규정하면 측정하지 않은 것을
    // 주장하게 된다. 문구가 슬그머니 되돌아가는 것을 막는 회귀 테스트다.
    for (const [code, type] of Object.entries(STORY_TYPES)) {
      expect(type.description, code).not.toMatch(/당신/)
    }
  })
})
