# 팀 공통 에이전트 지침

이 파일은 이 저장소에서 일하는 모든 코딩 에이전트(Claude Code, Codex 등)가 따르는 규칙이다. `CLAUDE.md`와 `AGENTS.md`는 같은 내용을 유지한다.

## 프로젝트
vibe-team-lab은 빌드 도구 없이 동작하는 바닐라 HTML/CSS/JS "팀 허브" 정적 사이트다. 다섯 개 섹션(팀 소개, 할 일 보드, 주간 일정, 테마, 공지)을 팀원 다섯 명이 하나씩 맡아 구현한다.

## 실행과 검사
```bash
python3 -m http.server 8000     # http://localhost:8000 에서 확인 (file:// 로 열면 ES 모듈이 동작하지 않는다)
node scripts/check.mjs          # 검사. 실패하면 종료 코드 1
```

## 수정 범위
- 이슈에 적힌 담당 파일만 수정한다. 다른 역할의 파일은 읽기만 한다.
- 다음 공용 파일은 수정하지 않는다: `index.html`, `src/app.js`, `src/sections/index.js`, `src/lib/dom.js`, `src/styles/base.css`.
- `src/data/team.json`은 배열 끝에 자기 카드를 추가하는 것만 허용한다. 다른 사람 카드는 고치지 않는다.
- 새 파일이 필요하면 만들기 전에 사용자에게 확인한다. `src/sections/`에 섹션이 아닌 파일을 추가하면 검사가 실패한다.
- 공용 파일 변경이 꼭 필요하면 코드를 고치지 말고 그 이유를 이슈로 남기자고 제안한다.

## 코드 규칙
- 바닐라 JavaScript(ES 모듈)만 쓴다. npm 패키지, CDN, 프레임워크 등 외부 의존성을 추가하지 않는다.
- 각 섹션 파일은 `export const meta = { id, title, source }`와 `export function render(root, data)`를 내보낸다.
  - `root`는 섹션 본문 요소이고, `data`는 `meta.source`에 따라 app.js가 넘겨 준다(JSON 파일 내용, 테마 훅, 또는 null).
  - 모듈 최상위에서 `document`, `window`, `localStorage`를 쓰지 않는다. render 함수 안에서만 쓴다.
- 요소는 `src/lib/dom.js`의 `el()`로 만들고 문자열은 textContent로 넣는다. 데이터를 innerHTML에 넣지 않는다.
- 스타일은 `base.css`의 공용 클래스와 CSS 변수를 조합한다. 색 값을 코드에 직접 쓰지 않는다.
- localStorage 키는 `vibe-team-lab:` 접두사를 붙인다.
- 화면 문구와 코드 주석은 한국어로 짧게 쓴다.

## 커밋 전 확인
- 커밋 전에 반드시 `node scripts/check.mjs`를 실행해 통과를 확인한다. 실패하면 고친 뒤 다시 실행한다.
- 로컬 서버에서 자기 섹션이 오류 없이 그려지는지 확인한다.

## 브랜치, 커밋, PR 규칙
자세한 내용은 `docs/운영규칙.md`를 따른다. 요약은 다음과 같다.
- 브랜치 이름: `feat/<이슈번호>-<짧은설명>` (예: `feat/2-todo-board`). 버그는 `fix/<이슈번호>-<짧은설명>`.
- 커밋 메시지: `type: 요약` 형식(Conventional Commits). type은 feat, fix, docs, style, refactor, test, chore 중 하나이며 요약은 한국어로 쓸 수 있다.
- PR 하나에는 파일 3개, 변경 300줄 이내를 권장한다.
- PR 본문에 `Closes #이슈번호` 줄과 `에이전트: <사용한 도구>` 줄을 적는다.
- main 브랜치에 직접 푸시하지 않는다. 강제 푸시는 자기 작업 브랜치에서 `git push --force-with-lease`로만 한다.

## 비밀값
- API 키, 토큰, 비밀번호 등 비밀값을 코드, 커밋, 이슈, PR에 넣지 않는다.
- 로컬 비밀값은 `.env.local`에 두며 이 파일은 커밋하지 않는다(.gitignore에 포함).
