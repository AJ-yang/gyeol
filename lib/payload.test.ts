import { describe, expect, it } from 'vitest'
import { decodeChoices, encodeChoices } from './payload'
import { ROUNDS, type Choice } from './types'

const choices: Choice[] = Array.from({ length: ROUNDS }, (_, i) => ({
  winner: i * 2,
  loser: i * 2 + 1,
}))

describe('encodeChoices / decodeChoices', () => {
  it('인코딩 후 디코딩하면 원본과 같다', () => {
    expect(decodeChoices(encodeChoices(choices), 240)).toEqual(choices)
  })

  it('URL에 안전한 문자만 쓴다', () => {
    expect(encodeChoices(choices)).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('길이가 12라운드에 맞지 않으면 null을 낸다', () => {
    expect(decodeChoices(encodeChoices(choices.slice(0, 5)), 240)).toBeNull()
  })

  it('손상된 입력에 예외를 던지지 않고 null을 낸다', () => {
    expect(decodeChoices('!!!not-base64!!!', 240)).toBeNull()
    expect(decodeChoices('', 240)).toBeNull()
  })

  it('풀 크기를 넘는 인덱스는 null을 낸다', () => {
    expect(decodeChoices(encodeChoices(choices), 10)).toBeNull()
  })

  it('승자와 패자가 같으면 null을 낸다', () => {
    const broken = choices.map((c, i) => (i === 3 ? { winner: 7, loser: 7 } : c))
    expect(decodeChoices(encodeChoices(broken), 240)).toBeNull()
  })
})
