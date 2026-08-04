/**
 * 상영 전 화면들이 공유하는 생김새.
 *
 * 홈과 라운드 안내가 같은 언어를 쓰게 하려고 한곳에 모은다. 각자 비슷하게
 * 그려두면 한쪽만 고쳤을 때 조용히 어긋난다.
 *
 * **앰버는 결과 이전에만 쓴다.** 결 고유색은 결과가 나온 뒤에 등장하는 것이라,
 * 그 전 화면에서 미리 쓰면 색이 무엇을 뜻하는지가 흐려진다. 극장 조명색을
 * 빌려 "아직 상영 전"이라는 별도의 톤을 만든다.
 */
export const AMBER = '#e0b064'

/** 앰버를 옅게 깐 배경. 배지와 강조에 쓴다. */
export const AMBER_SOFT = 'rgba(224,176,100,0.16)'

/**
 * 영사기 빛.
 *
 * 위쪽 한 점에서 퍼지는 따뜻한 빛으로 시선을 가운데로 모은다. 내용 뒤에
 * 깔리도록 음수 z-index를 주고 클릭을 막지 않는다.
 */
export function ProjectorBeam() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10"
      style={{
        background:
          'radial-gradient(120% 70% at 50% -10%, rgba(224,176,100,0.20), rgba(224,176,100,0.05) 42%, transparent 70%)',
      }}
    />
  )
}

/**
 * 35mm 필름 가장자리.
 *
 * 배경색으로 뚫은 구멍이라야 필름으로 읽힌다. 밝은 줄무늬를 반복하면 바코드가
 * 된다 — 실제로 그렇게 만들었다가 고쳤다. 그래서 그라데이션 대신 구멍을 직접
 * 그린다. 개수가 고정이라 폭이 달라져도 간격이 일정하다.
 */
export function Perforations({ className }: { className: string }) {
  return (
    <div aria-hidden className={`flex items-center justify-between px-3 ${className}`}>
      {Array.from({ length: 13 }, (_, i) => (
        <span key={i} className="h-2 w-[7px] rounded-[2px] bg-neutral-950" />
      ))}
    </div>
  )
}

/** 상영 전 화면의 주 버튼. 극장 조명색이라 어두운 배경에서 유일하게 밝다. */
export function AmberButton({
  children,
  onClick,
  className = '',
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-8 py-4 text-lg font-bold text-black transition hover:brightness-110 active:scale-[0.99] ${className}`}
      style={{ backgroundColor: AMBER }}
    >
      {children}
    </button>
  )
}
