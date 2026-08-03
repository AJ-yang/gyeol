/**
 * 라운드 시작 전 안내 화면.
 *
 * 두 라운드가 형식이 달라서(고르기 / 둘 중 하나), 예고 없이 형식이 바뀌면
 * 사용자가 규칙을 화면에서 역추적해야 한다. 무엇을 몇 개 고르는지, 모르는
 * 작품은 어떻게 하는지를 먼저 알려주고 시작한다.
 */
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
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-7 px-6 py-12">
      <div>
        <p className="text-sm font-bold text-neutral-500">{step}</p>
        <h1 className="mt-2 text-2xl font-black break-keep sm:text-3xl">{title}</h1>
        <p className="mt-3 break-keep leading-relaxed text-neutral-300">{lead}</p>
      </div>

      <ul className="space-y-3">
        {rules.map((rule) => (
          <li key={rule} className="flex gap-3 break-keep leading-relaxed text-neutral-300">
            <span aria-hidden className="shrink-0 text-neutral-600">
              ·
            </span>
            {rule}
          </li>
        ))}
      </ul>

      <p className="break-keep rounded-xl bg-white/[0.06] px-4 py-3.5 text-sm leading-relaxed text-neutral-400">
        {note}
      </p>

      <button
        onClick={onStart}
        className="rounded-full bg-white px-8 py-4 text-lg font-bold text-black transition hover:bg-neutral-200"
      >
        {action}
      </button>
    </main>
  )
}
