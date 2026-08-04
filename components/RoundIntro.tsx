/**
 * 라운드 시작 전 안내 화면.
 *
 * 두 라운드가 형식이 달라서(고르기 / 둘 중 하나), 예고 없이 형식이 바뀌면
 * 사용자가 규칙을 화면에서 역추적해야 한다. 무엇을 몇 개 고르는지, 모르는
 * 작품은 어떻게 하는지를 먼저 알려주고 시작한다.
 *
 * 생김새는 **극장 입장권**을 빌린다. 이 서비스가 다루는 것이 영화와 드라마라
 * 안내 화면이 상영 전 순서처럼 읽히면 흐름이 자연스럽다. 영사기 빛, 필름
 * 퍼포레이션, 절취선이 그 신호다.
 *
 * 앰버(극장 조명색)를 강조색으로 쓴다. 결 고유색은 결과가 나온 뒤에야 등장하는
 * 것이라, 그 전 화면에서 미리 쓰면 색의 의미가 흐려진다.
 */
const AMBER = '#e0b064'

/**
 * 35mm 필름 가장자리.
 *
 * 배경색으로 뚫은 구멍이라야 필름으로 읽힌다. 밝은 줄무늬를 반복하면 바코드가
 * 된다 — 실제로 그렇게 만들었다가 고쳤다. 그래서 그라데이션 대신 구멍을 직접
 * 그린다. 개수가 고정이라 폭이 달라져도 간격이 일정하다.
 */
function Perforations({ className }: { className: string }) {
  return (
    <div aria-hidden className={`flex items-center justify-between px-3 ${className}`}>
      {Array.from({ length: 13 }, (_, i) => (
        <span key={i} className="h-2 w-[7px] rounded-[2px] bg-neutral-950" />
      ))}
    </div>
  )
}

export function RoundIntro({
  step,
  title,
  lead,
  rules,
  note,
  action,
  onStart,
}: {
  /** "1라운드" 같은 짧은 표시 */
  step: string
  title: string
  lead: string
  rules: string[]
  /** 왜 이 라운드가 있는지. 규칙이 아니라 이유라 따로 둔다 */
  note: string
  action: string
  onStart: () => void
}) {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-5 py-12">
      {/*
        영사기 빛. 위쪽 한 점에서 퍼지는 따뜻한 빛으로 시선을 카드로 모은다.
        내용 뒤에 깔리도록 음수 z-index를 주고 클릭을 막지 않는다.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(120% 70% at 50% -10%, rgba(224,176,100,0.20), rgba(224,176,100,0.05) 42%, transparent 70%)',
        }}
      />

      <section className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-[#121013] shadow-2xl shadow-black/60">
        <Perforations className="h-6 w-full border-b border-white/5" />

        <div className="px-6 pt-7 pb-6">
          {/*
            자간을 벌리지 않는다. 한글에 큰 자간을 주면 "1 라 운 드"처럼
            글자가 흩어져 오히려 대충 만든 것으로 보인다. 대신 앰버 알약으로
            묶어 표시 역할을 준다.
          */}
          <span
            className="inline-block rounded-full px-2.5 py-1 text-[11px] font-bold"
            style={{ backgroundColor: 'rgba(224,176,100,0.16)', color: AMBER }}
          >
            {step}
          </span>
          <h1 className="mt-3.5 text-2xl font-black break-keep sm:text-3xl">{title}</h1>
          <p className="mt-3 break-keep text-sm leading-relaxed text-neutral-400">{lead}</p>
        </div>

        {/*
          절취선. 양쪽 반원이 있어야 티켓으로 읽힌다 — 점선만 있으면 그냥
          구분선이다. 반원은 배경색과 같은 원을 카드 밖으로 반쯤 걸쳐 만든다.
        */}
        <div className="relative">
          <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-neutral-950 ring-1 ring-white/10" />
          <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-neutral-950 ring-1 ring-white/10" />
          <div className="mx-6 border-t border-dashed border-white/15" />
        </div>

        <div className="px-6 pt-6 pb-7">
          <ol className="space-y-3.5">
            {rules.map((rule, index) => (
              <li key={rule} className="flex gap-3 break-keep text-sm leading-relaxed text-neutral-300">
                <span
                  aria-hidden
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                  style={{ backgroundColor: 'rgba(224,176,100,0.15)', color: AMBER }}
                >
                  {index + 1}
                </span>
                {rule}
              </li>
            ))}
          </ol>

          <p
            className="mt-6 break-keep border-l-2 pl-3.5 text-xs leading-relaxed text-neutral-400"
            style={{ borderColor: 'rgba(224,176,100,0.45)' }}
          >
            {note}
          </p>
        </div>

        <Perforations className="h-6 w-full border-t border-white/5" />
      </section>

      <button
        onClick={onStart}
        className="mt-7 w-full max-w-sm rounded-full px-8 py-4 text-lg font-bold text-black transition hover:brightness-110 active:scale-[0.99]"
        style={{ backgroundColor: AMBER }}
      >
        {action}
      </button>
    </main>
  )
}
