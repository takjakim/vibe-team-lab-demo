# vibe-team-lab

GitHub 팀 바이브코딩 워크숍(Orca와 gh CLI로 4~5인 협업)의 실습용 템플릿 저장소다. 빌드 도구 없이 동작하는 바닐라 HTML/CSS/JS "팀 허브" 사이트를 다섯 명이 섹션 하나씩 나누어 완성하면서 이슈, 워크트리, 에이전트, PR, 리뷰, 충돌 해결의 흐름을 익힌다.

- 사이트 미리 보기: https://takjakim.kr/vibe-team-lab/ (GitHub Pages)
- 학습자 안내: [docs/실습가이드.md](docs/실습가이드.md)

## 시작 상태

다섯 섹션 파일이 모두 존재하지만 "준비 중" 자리표시자만 그린다. 각 팀원은 자기 섹션 파일만 고치므로 PR끼리 충돌하지 않는다. 충돌 연습은 공용 데이터 파일 `src/data/team.json`으로 따로 한다.

| 역할 | 섹션 | 담당 파일 |
|---|---|---|
| A | 팀 소개 | `src/sections/about.js` |
| B | 할 일 보드 | `src/sections/board.js` |
| C | 주간 일정 | `src/sections/schedule.js` |
| D | 테마(다크 모드) | `src/sections/theme.js`, `src/styles/theme.css` |
| E | 공지 | `src/sections/notice.js` |

역할별 완료 기준과 에이전트 프롬프트 예시는 [docs/역할카드.md](docs/역할카드.md)에 있다.

## 실행과 검사

```bash
python3 -m http.server 8000     # http://localhost:8000
node scripts/check.mjs          # JSON, team.json 규칙, 섹션 모듈, index.html 검사
```

ES 모듈을 쓰므로 `index.html`을 파일로 직접 열면 동작하지 않는다. 반드시 로컬 서버나 GitHub Pages로 연다. 검사 스크립트는 외부 의존성 없이 Node 20.19 이상에서 동작하며, 실패하면 종료 코드 1과 한국어 메시지를 출력한다. CI도 같은 스크립트를 실행한다.

## 폴더 구조

| 경로 | 설명 | 수정 |
|---|---|---|
| `index.html` | 헤더, 내비게이션, `<main id="app">`, 푸터 | 공용(금지) |
| `src/app.js` | 섹션 목록을 순서대로 렌더링, 테마 토글 훅 | 공용(금지) |
| `src/sections/index.js` | 섹션 순서 배열 `[about, board, schedule, theme, notice]` | 공용(금지) |
| `src/sections/*.js` | 섹션 모듈. `meta`와 `render(root, data)`를 내보낸다 | 역할별 |
| `src/lib/dom.js` | 요소 생성 도우미 `el()`, 자리표시자 `placeholder()` | 공용(금지) |
| `src/styles/base.css` | 공용 스타일과 CSS 변수 | 공용(금지) |
| `src/styles/theme.css` | 다크 모드 변수 | 역할 D |
| `src/data/*.json` | 팀, 일정, 공지 데이터. `team.json`은 배열 끝에만 추가 | 드릴 |
| `scripts/` | 검사 스크립트와 강사용 자동화 스크립트 | 강사 |
| `.github/` | CI, Pages 배포, 이슈와 PR 템플릿, CODEOWNERS | 강사 |
| `CLAUDE.md`, `AGENTS.md` | 에이전트 공통 지침(같은 내용) | 강사 |
| `orca.yaml`, `.worktreeinclude` | Orca 워크트리 설정 | 강사 |
| `docs/` | 실습 가이드, 운영 규칙, 역할 카드, 충돌 드릴 | 강사 |

## 강사용 안내

### 팀 저장소 만들기

이 저장소는 템플릿 저장소다. 팀마다 저장소를 하나씩 만들고, 팀원 초대, 라벨과 이슈 생성, main 보호 규칙까지 한 번에 적용한다.

```bash
scripts/new-team-repo.sh <owner/name> <github-id ...>
# 예: scripts/new-team-repo.sh takjakim/team1-hub kim-a lee-b park-c choi-d jung-e
```

스크립트가 하는 일은 다음과 같다.

1. `gh repo create --template takjakim/vibe-team-lab --public --clone`
2. 병합 후 브랜치 삭제와 Squash 병합 설정, GitHub Pages(Actions 배포) 활성화
3. 팀원 초대(push 권한). 팀원은 메일에서 초대를 수락해야 한다
4. `scripts/seed-issues.sh`로 라벨 9개와 이슈 6개(역할 A~E, 충돌 드릴) 생성
5. `scripts/protect-main.sh`로 main 보호

### 스크립트 목록

| 스크립트 | 사용법 | 설명 |
|---|---|---|
| `scripts/check.mjs` | `node scripts/check.mjs` | 저장소 검사. CI의 `check` 작업 |
| `scripts/seed-issues.sh` | `scripts/seed-issues.sh [owner/name]` | 라벨과 실습 이슈 생성. 같은 제목은 건너뜀 |
| `scripts/new-team-repo.sh` | `scripts/new-team-repo.sh <owner/name> <github-id ...>` | 팀 저장소 생성 일괄 처리 |
| `scripts/protect-main.sh` | `scripts/protect-main.sh [owner/name] [--dry-run]` | main 보호 규칙 적용 |
| `scripts/conflict-drill.sh` | `scripts/conflict-drill.sh [owner/name]` | main의 team.json 끝에 강사 카드 추가 |

### main 보호 규칙

`scripts/protect-main.sh`는 팀 저장소의 main 브랜치에 다음 규칙을 건다.

- PR을 거쳐야만 병합할 수 있다.
- 승인 1명이 필요하다.
- 상태 검사 `check`(CI)가 통과해야 한다.
- 강제 푸시와 브랜치 삭제를 금지한다.
- 관리자는 규칙을 우회할 수 있다(강사의 충돌 드릴 푸시용).

```bash
scripts/protect-main.sh takjakim/team1-hub --dry-run   # 보낼 설정만 확인
scripts/protect-main.sh takjakim/team1-hub             # 적용
```

템플릿 저장소 자체에는 적용하지 않는다. 강사가 템플릿을 자유롭게 고치고 푸시해야 하므로 스크립트도 템플릿 저장소 이름이 오면 `--force` 없이는 실행을 거부한다.

### CODEOWNERS

템플릿 상태에서는 기본 소유자 `* @takjakim`만 활성화되어 있다. 팀 저장소를 만든 뒤 `.github/CODEOWNERS`의 역할별 줄 주석을 풀고 자리표시자를 팀원 아이디로 바꾸면, 해당 파일을 바꾸는 PR에 담당자가 리뷰어로 자동 지정된다.

## 문서

| 문서 | 대상 | 내용 |
|---|---|---|
| [docs/실습가이드.md](docs/실습가이드.md) | 학습자 | 실습 1~4 명령 단위 안내 |
| [docs/역할카드.md](docs/역할카드.md) | 학습자 | 역할 A~E 담당 파일, 완료 기준, 프롬프트 예시 |
| [docs/운영규칙.md](docs/운영규칙.md) | 전원 | 브랜치, 커밋, PR, 리뷰, 금지 사항 |
| [docs/충돌드릴.md](docs/충돌드릴.md) | 강사 | 충돌 드릴 진행 순서와 복구 방법 |

## 라이선스

MIT. [LICENSE](LICENSE)를 참고한다.
