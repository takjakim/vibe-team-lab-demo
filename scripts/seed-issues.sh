#!/usr/bin/env bash
# 실습용 라벨과 이슈 6개(역할 A~E, 충돌 드릴)를 만든다.
# 사용법: scripts/seed-issues.sh [owner/name]
#   owner/name을 생략하면 현재 폴더의 GitHub 저장소에 만든다.
#   같은 제목의 이슈가 이미 있으면 건너뛰므로 여러 번 실행해도 안전하다.
set -euo pipefail

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
  sed -n '2,5p' "$0" | sed 's/^# \{0,1\}//'
  exit 0
fi

command -v gh >/dev/null 2>&1 || { echo "gh(GitHub CLI)가 설치되어 있지 않습니다." >&2; exit 1; }
REPO="${1:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"
echo "대상 저장소: $REPO"

# ---------------------------------------------------------------
# 라벨 (이미 있으면 색과 설명만 갱신)
# ---------------------------------------------------------------
label() {
  gh label create "$1" --repo "$REPO" --color "$2" --description "$3" --force >/dev/null
  echo "라벨: $1"
}

label "role:A" "1f6feb" "역할 A: 팀 소개 섹션"
label "role:B" "8250df" "역할 B: 할 일 보드 섹션"
label "role:C" "bf3989" "역할 C: 주간 일정 섹션"
label "role:D" "0a7d6e" "역할 D: 다크 모드와 테마"
label "role:E" "bc4c00" "역할 E: 공지 섹션"
label "type:feature" "0e8a16" "기능 추가"
label "type:bug" "d73a4a" "버그 수정"
label "drill" "fbca04" "충돌 드릴 실습"
label "good first issue" "7057ff" "처음 시작하기 좋은 이슈"

# ---------------------------------------------------------------
# 이슈
# 본문의 __N__은 생성 후 실제 이슈 번호로 바꾼다.
# ---------------------------------------------------------------
EXISTING_TITLES="$(gh issue list --repo "$REPO" --state all --limit 500 --json title -q '.[].title')"

issue() {
  local title="$1" labels="$2" body="$3" url number
  if [ -n "$EXISTING_TITLES" ] && printf '%s\n' "$EXISTING_TITLES" | grep -Fxq -- "$title"; then
    echo "건너뜀(같은 제목 있음): $title"
    return
  fi
  url="$(gh issue create --repo "$REPO" --title "$title" --label "$labels" --body "$body")"
  number="${url##*/}"
  gh issue edit "$number" --repo "$REPO" --body "${body//__N__/$number}" >/dev/null
  echo "이슈 #$number: $title"
}

COMMON_FOOTER='## 검사 명령
```bash
node scripts/check.mjs            # 커밋 전에 반드시 통과
python3 -m http.server 8000       # http://localhost:8000 에서 화면 확인
```

## 진행 순서
1. Orca에서 이 이슈를 연결한 워크트리를 만든다. 브랜치 이름은 `feat/__N__-<짧은설명>` 형식을 따른다.
2. 에이전트에게 이 이슈 번호와 담당 파일을 알려 주고 구현을 요청한다. 프롬프트 예시는 `docs/역할카드.md`에 있다.
3. 검사를 통과하면 PR을 만들고 본문에 `Closes #__N__` 줄과 `에이전트: <사용한 도구>` 줄을 적는다.
4. 팀원 1명의 승인과 CI(check) 통과 후 Squash and merge로 병합한다.

공용 파일(`index.html`, `src/app.js`, `src/sections/index.js`, `src/lib/dom.js`, `src/styles/base.css`)은 수정하지 않는다.'

issue "[역할 A] 팀 소개: team.json 카드 그리드" "role:A,type:feature,good first issue" "## 목표
팀원 정보를 카드 그리드로 보여 주는 \"팀 소개\" 섹션을 완성한다.

## 담당 파일
- \`src/sections/about.js\` (이 파일만 수정한다)
- 읽기 전용 데이터: \`src/data/team.json\`

## 완료 기준
- [ ] team.json의 모든 항목이 카드 하나씩으로 표시된다.
- [ ] 카드마다 이름, 역할, 관심 분야, GitHub 프로필 링크(https://github.com/아이디)가 있다.
- [ ] 카드는 base.css의 \`.grid\`, \`.profile\` 클래스를 쓰고, 폭 390px 화면에서도 잘리지 않는다.
- [ ] 항목이 0개이면 \"아직 등록된 팀원이 없습니다.\" 문구를 보여 준다.
- [ ] 문자열은 \`el()\` 또는 textContent로 넣는다. innerHTML에 데이터를 넣지 않는다.

$COMMON_FOOTER"

issue "[역할 B] 할 일 보드: 추가, 완료, 삭제와 저장" "role:B,type:feature" "## 목표
팀 할 일을 추가하고 완료 표시하고 삭제할 수 있는 \"할 일 보드\" 섹션을 완성한다.

## 담당 파일
- \`src/sections/board.js\` (이 파일만 수정한다)

## 완료 기준
- [ ] 입력창에 할 일을 적고 추가 버튼 또는 Enter로 목록에 추가된다. 빈 값은 추가되지 않는다.
- [ ] 항목마다 완료 체크박스와 삭제 버튼이 있고, 완료 항목은 \`.is-done\`으로 표시된다.
- [ ] 목록은 localStorage의 \`vibe-team-lab:board\` 키에 저장되어 새로고침 후에도 남는다.
- [ ] 남은 할 일 개수를 보여 준다.
- [ ] 저장값이 깨져 있어도 오류 없이 빈 목록으로 시작한다.

$COMMON_FOOTER"

issue "[역할 C] 주간 일정: schedule.json 요일별 표시" "role:C,type:feature" "## 목표
schedule.json의 일정을 요일별로 묶어 보여 주는 \"주간 일정\" 섹션을 완성한다.

## 담당 파일
- \`src/sections/schedule.js\` (이 파일만 수정한다)
- 읽기 전용 데이터: \`src/data/schedule.json\` (\`{ week, items: [{ day, time, title, owner }] }\`)

## 완료 기준
- [ ] 월요일부터 금요일 순서로 요일 묶음(\`.day-group\`)을 만들고, 묶음 안은 시간순으로 정렬한다.
- [ ] 항목마다 시간, 제목, 담당자(\`.badge\`)를 보여 준다.
- [ ] 오늘 요일 묶음에 \`.is-today\` 클래스를 붙여 강조한다.
- [ ] 일정이 없는 요일은 \"일정 없음\"으로 표시한다.
- [ ] 제목 옆에 \`week\` 값을 보조 문구로 보여 준다.

$COMMON_FOOTER"

issue "[역할 D] 다크 모드: 테마 변수와 테마 선택" "role:D,type:feature" "## 목표
다크 모드 색을 정의하고, 테마를 고르는 \"테마\" 섹션을 완성한다.

## 담당 파일
- \`src/styles/theme.css\`
- \`src/sections/theme.js\`
- 이 섹션의 data는 app.js가 넘겨 주는 테마 훅이다: \`getPreference()\`, \`getCurrent()\`, \`set(값)\`, \`toggle()\`, \`onChange(fn)\`

## 완료 기준
- [ ] theme.css의 \`:root[data-theme=\"dark\"]\`에 \`color-scheme: dark\`와 base.css의 모든 색 변수 다크 값을 정의한다.
- [ ] 헤더의 다크 모드 버튼을 누르면 화면 전체 색이 바뀌고, 새로고침 후에도 유지된다.
- [ ] 테마 섹션에 \"시스템 설정 따르기\", \"라이트\", \"다크\" 선택지가 있고 고른 값이 바로 적용된다.
- [ ] 헤더 버튼으로 바꿔도 테마 섹션의 선택 상태가 함께 바뀐다(\`onChange\` 사용).
- [ ] 다크 모드에서 본문 글자와 배경의 대비가 충분하다.

$COMMON_FOOTER"

issue "[역할 E] 공지 배너: notices.json 표시와 닫기 기억" "role:E,type:feature" "## 목표
공지를 배너로 보여 주고, 닫은 공지를 기억하는 \"공지\" 섹션을 완성한다.

## 담당 파일
- \`src/sections/notice.js\` (이 파일만 수정한다)
- 읽기 전용 데이터: \`src/data/notices.json\` (\`[{ id, date, level, title, body }]\`)

## 완료 기준
- [ ] 공지를 날짜 최신순으로 \`.banner\`로 보여 주고, level이 important이면 \`.is-important\`를 붙인다.
- [ ] 배너마다 닫기 버튼이 있고, 닫은 공지 id는 localStorage의 \`vibe-team-lab:dismissed-notices\` 키에 저장된다.
- [ ] 새로고침해도 닫은 공지는 다시 나오지 않는다.
- [ ] 모두 닫으면 \"새 공지가 없습니다.\"와 \"닫은 공지 다시 보기\" 버튼을 보여 준다.
- [ ] 닫기 버튼에 \`aria-label\`(예: \"공지 닫기\")이 있다.

$COMMON_FOOTER"

issue "팀 카드에 자기 소개 추가" "drill,good first issue" "## 목표
\`src/data/team.json\` 배열 끝에 자기 카드를 추가하는 PR을 만든다. 강사가 같은 위치를 바꾸면 병합 충돌이 생기며, 이를 해결하는 과정을 연습한다.

## 담당 파일
- \`src/data/team.json\` (배열 끝에만 추가한다. 다른 사람 카드는 고치지 않는다)

## 추가할 형식
\`\`\`json
  {
    \"name\": \"홍길동\",
    \"role\": \"역할 A\",
    \"focus\": \"팀 소개 섹션\",
    \"github\": \"내-github-아이디\"
  }
\`\`\`
바로 앞 카드의 닫는 중괄호 뒤에 쉼표를 붙인다. 마지막 카드 뒤에는 쉼표를 붙이지 않는다.

## 완료 기준
- [ ] 자기 카드가 배열 마지막에 있다.
- [ ] 필수 키 name, role, focus, github가 모두 있고 github 아이디가 다른 카드와 겹치지 않는다.
- [ ] 충돌이 나면 강사 카드와 자기 카드를 모두 남기고, 충돌 표시 줄(<<<<<<<, =======, >>>>>>>)을 지운다.
- [ ] 해결 후 \`node scripts/check.mjs\`를 통과하고 \`git push --force-with-lease\`로 올린다.

## 검사 명령
\`\`\`bash
node scripts/check.mjs
\`\`\`

## 진행 순서
1. 브랜치 이름: \`feat/__N__-card-<내아이디>\`
2. 여러 사람이 이 이슈 하나로 각자 PR을 만들므로 PR 본문에는 \`Closes\` 대신 \`Refs #__N__\`을 적는다. 이슈는 강사가 마지막에 닫는다.
3. 자세한 절차는 \`docs/실습가이드.md\`의 실습 4와 \`docs/충돌드릴.md\`를 따른다."

echo "완료: https://github.com/$REPO/issues"
