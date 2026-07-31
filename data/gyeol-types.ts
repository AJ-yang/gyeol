import type { Gyeol } from '../lib/gyeol/types'

/**
 * 정본은 docs/superpowers/specs/2026-07-31-gyeol-types.md 다.
 * 문안을 고칠 일이 생기면 그 문서를 먼저 고치고 여기로 옮긴다.
 *
 * 조건 키워드는 TMDB에 실존하는 것만 쓴다. 스펙 작성 시 123개를 전수
 * 검사해 118개 실존을 확인했고 없던 5개는 대체어로 바꿨다.
 *
 * `genres`에 '드라마'를 넣지 않는다. 작품의 60.7%에 붙어 있어 변별력이 없다.
 */
export const GYEOL_TYPES: Gyeol[] = [
  {
    id: 'revenge',
    name: '서늘한 복수의 결',
    description:
      '소리치는 분노를 믿지 않습니다. 참던 사람이 마침내 움직이는 순간을 위해 앞의 두 시간을 견딜 수 있는 사람입니다. 평화로운 오프닝은 좀 못 참고요.',
    keywords: ['revenge', 'murder', 'neo-noir', 'corruption', 'gangster', 'organized crime'],
    genres: ['범죄', '스릴러'],
  },
  {
    id: 'clue',
    name: '단서를 줍는 결',
    description:
      '범인이 누구인지보다 어떻게 알아냈는지가 궁금합니다. 결말을 먼저 본 적은 한 번도 없습니다. 그런 사람을 좀 경멸하는 편이고요.',
    keywords: ['investigation', 'detective', 'police', 'serial killer', 'mystery', 'missing person'],
    genres: ['미스터리', '범죄'],
  },
  {
    id: 'suspicion',
    name: '의심이 자라는 결',
    description:
      '누가 죽는지보다 누구를 믿어야 하는지가 더 무섭습니다. 조용한 장면에서 오히려 어깨에 힘이 들어갑니다. 반전 없는 스릴러는 배신이라고 생각하죠.',
    keywords: ['suspenseful', 'psychological thriller', 'paranoia', 'conspiracy', 'betrayal', 'hidden identity'],
    genres: ['스릴러'],
  },
  {
    id: 'anger',
    name: '화가 나는 결',
    description:
      '이야기가 개인의 불운이 아니라 구조의 문제라고 말할 때 반응합니다. 통쾌한 해결보다 찝찝한 여운을 택합니다. 보고 나서 한동안 말이 없어지는 것도 포함해서요.',
    keywords: ['social commentary', 'class differences', 'corruption', 'capitalism', 'poverty', 'whistleblower'],
    genres: ['범죄'],
  },
  {
    id: 'dark-room',
    name: '불 끄고 보는 결',
    description:
      '무서운 걸 알면서도 굳이 밤에 봅니다. 놀라게 하는 것보다 서서히 조여오는 쪽을 높이 칩니다. 다음 날 화장실 갈 때 후회하고요.',
    keywords: ['horror', 'supernatural', 'haunting', 'monster', 'demon', 'curse'],
    genres: ['공포'],
  },
  {
    id: 'survivor',
    name: '끝까지 남는 결',
    description:
      '세상이 무너진 다음부터가 진짜 이야기라고 생각합니다. 누가 살아남느냐보다 무엇을 포기하느냐를 봅니다. 물자 계산하는 장면을 유독 좋아하죠.',
    keywords: ['survival', 'zombie', 'dystopia', 'apocalypse', 'post-apocalyptic', 'pandemic'],
    genres: ['SF', '스릴러', '공포'],
  },
  {
    id: 'smash',
    name: '크게 부수는 결',
    description:
      '설명은 짧을수록 좋고 액션은 길수록 좋습니다. 왜 싸우는지는 대충 알면 됩니다. 사실 그것도 그렇게 안 궁금하고요.',
    keywords: ['chase', 'explosion', 'martial arts', 'heist', 'spy', 'assassin'],
    genres: ['액션', '모험'],
  },
  {
    id: 'cape',
    name: '망토를 믿는 결',
    description:
      '힘을 가진 사람이 그 힘을 어떻게 쓰는지가 재미의 전부입니다. 세계관이 이어지는 것도 부담이 아니라 즐거움입니다. 쿠키영상 끝까지 앉아 있는 쪽이죠.',
    keywords: ['superhero', 'super power', 'secret identity', 'alien invasion'],
    genres: ['액션', 'SF', '모험'],
  },
  {
    id: 'far-sight',
    name: '멀리 보는 결',
    description:
      '지금 여기가 아닌 곳의 이야기에 끌립니다. 기술이 사람을 어떻게 바꾸는지를 보려고 두 시간을 씁니다. 설정 설명이 길어도 화 안 냅니다.',
    keywords: ['space', 'artificial intelligence', 'future', 'alien', 'spacecraft', 'cyberpunk'],
    genres: ['SF'],
  },
  {
    id: 'rewind',
    name: '되돌리고 싶은 결',
    description:
      '한 번 더 기회가 주어지면 사람이 어떻게 하는지를 보고 싶어 합니다. 시간이 꼬이는 설정을 기꺼이 따라갑니다. 설정 구멍은 발견하되 눈감아주는 편이고요.',
    keywords: ['time travel', 'time loop', 'parallel universe', 'alternate timeline', 'multiverse', 'reincarnation'],
    genres: ['SF', '판타지'],
  },
  {
    id: 'other-rules',
    name: '규칙이 다른 세계의 결',
    description:
      '여기서는 안 되는 일이 거기서는 되는 이야기를 좋아합니다. 마법이든 귀신이든 규칙만 일관되면 납득합니다. 세계관 설정집이 있으면 읽는 쪽이죠.',
    keywords: ['magic', 'witch', 'wizard', 'supernatural', 'mythology', 'fairy tale'],
    genres: ['판타지'],
  },
  {
    id: 'late-heart',
    name: '마음이 늦게 도착하는 결',
    description:
      '고백하는 장면보다 고백하기까지가 좋습니다. 서로 알면서 모르는 척하는 구간에서 가장 몰입합니다. 빨리 사귀면 좀 아쉬워하고요.',
    keywords: ['romance', 'romantic', 'love triangle', 'unrequited love', 'slow burn'],
    genres: ['로맨스'],
  },
  {
    id: 'bicker',
    name: '티격태격의 결',
    description:
      '처음엔 서로 못마땅해야 제맛이라고 생각합니다. 무거운 이야기를 굳이 찾아보지는 않습니다. 결말을 알아도 또 봅니다.',
    keywords: ['romcom', 'workplace romance', 'fake relationship', 'enemies to lovers'],
    genres: ['로맨스', '코미디'],
  },
  {
    id: 'back-then',
    name: '그때로 돌아가는 결',
    description:
      '첫사랑이 이루어지지 않아도 괜찮다고 생각합니다. 그 시절의 공기와 음악이 이야기의 절반입니다. 보고 나면 옛날 플레이리스트를 켜죠.',
    keywords: ['first love', 'nostalgia', 'high school', 'coming of age', 'youth', '1980s', '1990s'],
    genres: ['로맨스'],
  },
  {
    id: 'growing-up',
    name: '어른이 되는 중인 결',
    description:
      '완성된 인물보다 아직 자라는 인물에 마음이 갑니다. 실수하고 부딪히는 과정을 지루해하지 않습니다. 어른들이 답답하게 나오면 더 좋아하고요.',
    keywords: ['coming of age', 'school', 'teenager', 'friendship', 'self-discovery'],
    genres: ['코미디'],
  },
  {
    id: 'together',
    name: '같이 가는 결',
    description:
      '혼자 해내는 이야기보다 여럿이 버티는 이야기를 고릅니다. 실력보다 신뢰가 문제를 푸는 장면에 약합니다. 팀 해체 위기 편에서 제일 몰입하죠.',
    keywords: ['friendship', 'teamwork', 'loyalty', 'found family', 'camaraderie'],
    genres: ['모험', '코미디'],
  },
  {
    id: 'dinner-table',
    name: '밥상 앞의 결',
    description:
      '큰 사건 없이도 두 시간이 갑니다. 가족이 서로에게 못하는 말이 쌓이는 과정을 견딜 수 있습니다. 명절에 보면 좀 위험하고요.',
    keywords: ['family relationships', 'parenthood', 'siblings', 'family drama', 'dysfunctional family', 'father son relationship'],
    genres: ['가족'],
  },
  {
    id: 'laugh-then-chill',
    name: '웃다가 서늘해지는 결',
    description:
      '웃기다가 갑자기 조용해지는 순간을 기다립니다. 대놓고 슬픈 것보다 웃으면서 슬픈 쪽이 오래 남습니다. 남들 웃을 때 혼자 안 웃기도 하죠.',
    keywords: ['dark comedy', 'satire', 'black humor', 'irony', 'absurd'],
    genres: ['코미디'],
  },
  {
    id: 'no-thinking',
    name: '아무 생각 없고 싶은 결',
    description:
      '볼 때만큼은 머리를 안 쓰고 싶습니다. 개연성은 다음 날 따지기로 합니다. 그리고 안 따지죠.',
    keywords: ['slapstick comedy', 'buddy comedy', 'parody', 'heartwarming', 'comedy of errors'],
    genres: ['코미디'],
  },
  {
    id: 'old-clothes',
    name: '옛 옷을 입은 결',
    description:
      '지금과 다른 규칙 속에서 사람이 어떻게 사는지를 봅니다. 말투와 옷이 바뀌어도 욕망은 그대로라는 점에 끌립니다. 고증 틀리면 조금 신경 쓰이고요.',
    keywords: ['joseon dynasty (1392–1910)', 'historical', 'period drama', 'royal court', 'korean history'],
    genres: ['역사'],
  },
  {
    id: 'stairs',
    name: '계단을 오르내리는 결',
    description:
      '신분이 다른 두 사람이 만나는 이야기에 반응합니다. 사랑보다 그 사이의 거리가 진짜 주인공이라고 생각합니다. 재벌 회장님 등장하면 자세 고쳐 앉죠.',
    keywords: ['chaebol', 'hidden identity', 'class differences', 'arranged marriage', 'secret past'],
    genres: ['로맨스'],
  },
  {
    id: 'real-happened',
    name: '진짜 있었던 결',
    description:
      '지어낸 이야기보다 실제로 벌어진 일이 더 세다고 믿습니다. 보고 나면 검색해서 사실 확인을 합니다. 각색된 부분 찾아내면 좀 뿌듯하고요.',
    keywords: ['biography', 'true crime', 'historical event', 'war', 'based on real person'],
    genres: ['역사', '다큐'],
  },
  {
    id: 'drawn-tears',
    name: '그림으로 우는 결',
    description:
      '실사가 못 하는 걸 그림이 한다고 생각합니다. 아이용이라는 말에 동의하지 않습니다. 극장에서 혼자 우는 것도 익숙하고요.',
    keywords: ['friendship', 'family', 'adventure', 'magic', 'talking animals', 'growing up'],
    genres: ['애니', '가족'],
  },
  {
    id: 'sound',
    name: '소리에 약한 결',
    description:
      '이야기보다 음악이 먼저 기억에 남습니다. 무대에 서는 순간을 위해 앞의 연습 장면을 다 봅니다. OST부터 사는 쪽이죠.',
    keywords: ['music', 'musician', 'band', 'singer', 'concert', 'dance'],
    genres: ['음악'],
  },
  {
    id: 'lingering',
    name: '오래 남는 결',
    description:
      '사건이 적은 이야기를 견딜 수 있습니다. 설명하지 않고 보여주기만 하는 장면을 오히려 신뢰합니다. 남들이 지루하다고 할 때 반박하진 않고요.',
    keywords: ['melancholy', 'loneliness', 'existentialism', 'slice of life', 'quiet', 'contemplative'],
    genres: [],
  },
]
