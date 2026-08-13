#!/usr/bin/env bash
set -euo pipefail

REMOTE="origin"
DEFAULT_BRANCH="master"

BRANCHES=(
  "add-offline-sync-tests-7737522888080211660"
  "fix/technician-api-injection-17279834429181015455"
  "refactor/reports-export-pdf-12510046535532738811"
  "fix/auth-hardcoded-secret-6417204151689782859"
  "fix/servicenow-query-injection-15276322773444610994"
)

# Fetch up-to-date refs
git fetch "$REMOTE" "$DEFAULT_BRANCH"

for branch in "${BRANCHES[@]}"; do
  echo "================================================================"
  echo "Processing branch: $branch"
  echo "================================================================"

  git fetch "$REMOTE" "$branch" || continue

  # Checkout the PR branch
  if git show-ref --verify --quiet "refs/heads/$branch"; then
    git checkout "$branch"
    git reset --hard "$REMOTE/$branch"
  else
    git checkout -b "$branch" "$REMOTE/$branch" || continue
  fi

  # Merge default branch into PR branch, preferring current branch on conflicts
  set +e
  git merge --no-edit -s recursive -X ours "$REMOTE/$DEFAULT_BRANCH"
  MERGE_EXIT=$?
  set -e

  if [ $MERGE_EXIT -ne 0 ]; then
    echo "Merge reported conflicts. Resolving..."
    CONFLICT_FILES=$(git diff --name-only --diff-filter=U || true)
    if [ -n "$CONFLICT_FILES" ]; then
      for f in $CONFLICT_FILES; do
        git checkout --ours -- "$f"
        git add "$f"
      done
    fi
    git commit -m "Merge $DEFAULT_BRANCH into $branch (auto-resolve prefer PR branch)"
  fi
done
