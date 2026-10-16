#!/usr/bin/env bash
# main 브랜치 보호 규칙을 건다.
#   PR 필수, 승인 1명, 상태 검사 check 통과 필수, 강제 푸시와 브랜치 삭제 금지.
# 사용법: scripts/protect-main.sh [owner/name] [--dry-run]
#   owner/name을 생략하면 현재 폴더의 GitHub 저장소에 적용한다.
#   --dry-run은 보낼 설정만 출력하고 실제로 적용하지 않는다.
# 주의: 템플릿 저장소(takjakim/vibe-team-lab)에는 실행하지 않는다. 팀 저장소에만 쓴다.
#       관리자는 규칙을 우회할 수 있도록 enforce_admins를 끈다(강사의 충돌 드릴 푸시용).
set -euo pipefail

TEMPLATE="${TEMPLATE_REPO:-takjakim/vibe-team-lab}"
DRY_RUN=0
FORCE=0
REPO=""

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --force) FORCE=1 ;;
    -h|--help) sed -n '2,9p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) REPO="$arg" ;;
  esac
done

command -v gh >/dev/null 2>&1 || { echo "gh(GitHub CLI)가 설치되어 있지 않습니다." >&2; exit 1; }
REPO="${REPO:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"

if [ "$REPO" = "$TEMPLATE" ] && [ "$FORCE" -ne 1 ]; then
  echo "템플릿 저장소($TEMPLATE)에는 보호 규칙을 걸지 않습니다. 정말 필요하면 --force를 붙이십시오." >&2
  exit 1
fi

PAYLOAD='{
  "required_status_checks": { "strict": false, "contexts": ["check"] },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": false,
    "require_code_owner_reviews": false
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}'

if [ "$DRY_RUN" -eq 1 ]; then
  echo "[미리 보기] PUT repos/$REPO/branches/main/protection"
  echo "$PAYLOAD"
  exit 0
fi

printf '%s' "$PAYLOAD" | gh api -X PUT "repos/$REPO/branches/main/protection" \
  -H "Accept: application/vnd.github+json" --input - >/dev/null

echo "main 보호 규칙을 적용했습니다: $REPO"
echo "  PR 필수, 승인 1명, 상태 검사 check 필수, 강제 푸시와 삭제 금지"
echo "  확인: https://github.com/$REPO/settings/branches"
