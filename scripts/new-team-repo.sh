#!/usr/bin/env bash
# 템플릿으로 팀 저장소를 만들고 팀원 초대, 라벨과 이슈 생성, main 보호까지 한 번에 진행한다.
# 사용법: scripts/new-team-repo.sh <owner/name> <github-id ...>
# 예:     scripts/new-team-repo.sh takjakim/team1-hub kim-a lee-b park-c choi-d jung-e
#   현재 폴더 아래에 name 폴더로 복제된다.
#   다른 템플릿을 쓰려면 TEMPLATE_REPO=owner/name 환경 변수를 지정한다.
set -euo pipefail

TEMPLATE="${TEMPLATE_REPO:-takjakim/vibe-team-lab}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

usage() { sed -n '2,7p' "$0" | sed 's/^# \{0,1\}//'; }

if [ $# -lt 1 ] || [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
  usage
  exit 1
fi

REPO="$1"
shift
case "$REPO" in
  */*) ;;
  *) echo "저장소는 owner/name 형식으로 적어야 합니다: $REPO" >&2; exit 1 ;;
esac
NAME="${REPO#*/}"

command -v gh >/dev/null 2>&1 || { echo "gh(GitHub CLI)가 설치되어 있지 않습니다." >&2; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "먼저 gh auth login으로 로그인하십시오." >&2; exit 1; }
if [ -e "$NAME" ]; then
  echo "현재 폴더에 $NAME 이(가) 이미 있습니다. 다른 폴더에서 실행하십시오." >&2
  exit 1
fi

echo "[1/5] 템플릿($TEMPLATE)으로 저장소 생성: $REPO"
gh repo create "$REPO" --template "$TEMPLATE" --public --clone

# 템플릿 복사는 서버에서 비동기로 진행된다. main 브랜치가 생길 때까지 기다린다.
for _ in $(seq 1 30); do
  gh api "repos/$REPO/branches/main" >/dev/null 2>&1 && break
  sleep 2
done
if ! git -C "$NAME" rev-parse --verify -q HEAD >/dev/null; then
  git -C "$NAME" fetch origin
  git -C "$NAME" checkout -B main origin/main
fi

echo "[2/5] 저장소 설정: 병합 후 브랜치 삭제, Squash 병합, Pages"
gh repo edit "$REPO" --delete-branch-on-merge --enable-squash-merge --enable-merge-commit=false --enable-rebase-merge=false
if PAGES_URL="$(gh api -X POST "repos/$REPO/pages" -f build_type=workflow -q .html_url 2>/dev/null)"; then
  gh workflow run pages.yml --repo "$REPO" >/dev/null 2>&1 || true
  echo "  Pages를 켰습니다: $PAGES_URL"
else
  echo "  Pages 설정을 건너뜁니다(이미 켜져 있거나 권한이 없습니다)."
fi

echo "[3/5] 팀원 초대(push 권한)"
if [ $# -eq 0 ]; then
  echo "  초대할 아이디가 없어 건너뜁니다."
fi
for id in "$@"; do
  if gh api -X PUT "repos/$REPO/collaborators/$id" -f permission=push >/dev/null; then
    echo "  초대: $id"
  else
    echo "  초대 실패: $id (아이디를 확인하십시오)"
  fi
done

echo "[4/5] 라벨과 이슈 생성"
"$SCRIPT_DIR/seed-issues.sh" "$REPO"

echo "[5/5] main 보호 규칙"
"$SCRIPT_DIR/protect-main.sh" "$REPO"

cat <<MSG

완료했습니다.
  저장소: https://github.com/$REPO
  이슈:   https://github.com/$REPO/issues
  복제본: ./$NAME
팀원은 메일 또는 https://github.com/$REPO/invitations 에서 초대를 수락해야 푸시할 수 있습니다.
역할별 리뷰어를 지정하려면 .github/CODEOWNERS의 주석을 풀고 팀 아이디로 바꾼 뒤 PR로 반영하십시오.
MSG
