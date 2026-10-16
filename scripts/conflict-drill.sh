#!/usr/bin/env bash
# 강사용 충돌 드릴: main의 src/data/team.json 배열 끝에 "강사" 카드를 추가하는 커밋을 올린다.
# 팀원이 같은 위치에 자기 카드를 추가한 브랜치는 이후 rebase나 병합 때 반드시 충돌한다.
# 사용법: scripts/conflict-drill.sh [owner/name]
#   owner/name을 생략하면 현재 폴더의 GitHub 저장소를 쓴다.
#   작업은 임시 폴더의 새 복제본에서 하므로 강사의 작업 폴더는 바뀌지 않는다.
#   카드의 github 값은 DRILL_GITHUB 환경 변수로 바꿀 수 있다(기본값 drill-instructor).
set -euo pipefail

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
  sed -n '2,7p' "$0" | sed 's/^# \{0,1\}//'
  exit 0
fi

command -v gh >/dev/null 2>&1 || { echo "gh(GitHub CLI)가 설치되어 있지 않습니다." >&2; exit 1; }
command -v node >/dev/null 2>&1 || { echo "node가 설치되어 있지 않습니다." >&2; exit 1; }
REPO="${1:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"
DRILL_GITHUB="${DRILL_GITHUB:-drill-instructor}"
TITLE="chore: 충돌 드릴용 강사 카드 추가"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo "[1/3] $REPO 의 main을 임시 폴더로 복제"
gh repo clone "$REPO" "$WORK/repo" -- --quiet --branch main
cd "$WORK/repo"

echo "[2/3] team.json 배열 끝에 강사 카드 추가"
DRILL_GITHUB="$DRILL_GITHUB" node --input-type=module <<'JS'
import { readFileSync, writeFileSync } from 'node:fs';
const file = 'src/data/team.json';
const text = readFileSync(file, 'utf8');
const team = JSON.parse(text);
const id = process.env.DRILL_GITHUB;
if (team.some((m) => String(m.github).toLowerCase() === id.toLowerCase())) {
  console.error(`이미 github 값이 ${id}인 카드가 있습니다. DRILL_GITHUB를 바꾸어 다시 실행하십시오.`);
  process.exit(2);
}
// 기존 줄 모양은 그대로 두고 마지막 ] 앞에만 덧붙인다.
const close = text.lastIndexOf(']');
const head = text.slice(0, close).replace(/\s*$/, '');
const card = [
  '  {',
  '    "name": "강사 (충돌 드릴)",',
  '    "role": "강사",',
  '    "focus": "충돌 드릴용 카드입니다. 해결할 때 이 카드와 자기 카드를 모두 남깁니다.",',
  `    "github": "${id}"`,
  '  }',
].join('\n');
const out = `${head}${head.endsWith('[') ? '' : ','}\n${card}\n${text.slice(close)}`;
JSON.parse(out);
writeFileSync(file, out);
JS
node scripts/check.mjs >/dev/null || { echo "추가 후 검사에 실패했습니다. main의 team.json을 먼저 확인하십시오." >&2; exit 1; }
git add src/data/team.json
git commit -q -m "$TITLE"

echo "[3/3] main에 푸시"
if git push -q origin HEAD:main; then
  echo "main에 직접 푸시했습니다."
else
  BRANCH="drill/instructor-card-$(date +%Y%m%d%H%M%S)"
  echo "main 직접 푸시가 막혔습니다(보호 규칙). 임시 브랜치 $BRANCH 와 PR로 진행합니다."
  git push -q origin "HEAD:refs/heads/$BRANCH"
  PR_URL="$(gh pr create --repo "$REPO" --base main --head "$BRANCH" --title "$TITLE" \
    --body "충돌 드릴용 강사 카드입니다. scripts/conflict-drill.sh가 만들었습니다.")"
  echo "PR: $PR_URL"
  if gh pr merge "$PR_URL" --repo "$REPO" --squash --admin --delete-branch; then
    echo "관리자 권한으로 병합했습니다."
  else
    cat <<MSG
자동 병합에 실패했습니다. 다음 중 하나로 병합하십시오.
  1) 팀원 1명이 승인하고 check가 통과한 뒤:  gh pr merge $PR_URL --squash --delete-branch
  2) 조건이 충족되면 자동 병합:              gh pr merge $PR_URL --squash --auto
MSG
    exit 1
  fi
fi

cat <<MSG

드릴 준비가 끝났습니다. 팀원에게 다음을 안내하십시오.
  git fetch origin
  git rebase origin/main            # team.json에서 충돌 발생
  (충돌 해결: 강사 카드와 자기 카드를 모두 남기고 표시 줄 삭제)
  node scripts/check.mjs
  git add src/data/team.json && git rebase --continue
  git push --force-with-lease
복구가 필요하면 git rebase --abort 로 처음 상태로 돌아갑니다. 자세한 내용은 docs/충돌드릴.md를 봅니다.
MSG
