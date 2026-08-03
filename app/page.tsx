import Link from 'next/link'

/**
 * 첫 화면.
 *
 * 이름을 먼저 설명한다. "결"은 서비스 이름이자 결과물의 단위인데, 아무 설명
 * 없이 "당신의 결"이라고 하면 무슨 말인지 알 수 없다. 다만 길게 쓰지 않는다 —
 * 여기서 할 일은 읽히는 것이 아니라 시작하게 하는 것이다.
 */
export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-8 px-6 py-12 text-center">
      <div>
        <h1 className="text-4xl font-black leading-tight sm:text-5xl">
          당신은 어떤 이야기에
          <br />
          끌리는가
        </h1>
        <p className="mt-5 break-keep leading-relaxed text-neutral-400">
          재미있게 본 영화와 드라마를 고르면
          <br />
          당신의 이야기 취향에 이름을 붙여드립니다.
        </p>
      </div>

      <div className="max-w-sm rounded-2xl bg-white/[0.05] px-5 py-5 text-left">
        <h2 className="text-sm font-bold text-neutral-300">왜 &lsquo;결&rsquo;인가요?</h2>
        <p className="mt-2.5 break-keep text-sm leading-relaxed text-neutral-400">
          나뭇결처럼, 겉으로 잘 드러나지 않아도 안에서 일정하게 흐르는 방향을 결이라고
          합니다. 어떤 이야기에 자꾸 끌리는지에도 그런 방향이 있습니다.
        </p>
        <p className="mt-3 break-keep text-sm leading-relaxed text-neutral-400">
          장르로는 잡히지 않는 그 방향에 이름을 붙입니다. 25개의 결 중 하나가 나와요.
        </p>
      </div>

      <Link
        href="/pick/"
        className="rounded-full bg-white px-8 py-4 text-lg font-bold text-black transition hover:bg-neutral-200"
      >
        시작하기
      </Link>

      <p className="text-xs text-neutral-600">약 1분 소요 · 로그인 없음</p>
    </main>
  )
}
