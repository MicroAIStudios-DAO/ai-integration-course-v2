#!/usr/bin/env bash
# Sync current branch with main and check for conflicts
# Usage: ./scripts/sync-with-main.sh [--auto-merge]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEFAULT_BRANCH="${DEFAULT_BRANCH:-main}"
AUTO_MERGE=false

# Parse arguments
for arg in "$@"; do
  case $arg in
    --auto-merge)
      AUTO_MERGE=true
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [--auto-merge]"
      echo ""
      echo "Options:"
      echo "  --auto-merge    Automatically merge without confirmation"
      echo "  --help, -h      Show this help message"
      exit 0
      ;;
  esac
done

echo -e "${BLUE}=== Syncing with $DEFAULT_BRANCH branch ===${NC}"

# Step 1: Update git config to fetch all branches
echo -e "\n${YELLOW}Step 1: Updating git configuration...${NC}"
git config remote.origin.fetch "+refs/heads/*:refs/remotes/origin/*" || true
echo -e "${GREEN}✓ Git config updated${NC}"

# Step 2: Fetch latest changes
echo -e "\n${YELLOW}Step 2: Fetching latest changes...${NC}"
git fetch origin
git fetch origin "$DEFAULT_BRANCH:refs/remotes/origin/$DEFAULT_BRANCH" 2>/dev/null || true
echo -e "${GREEN}✓ Latest changes fetched${NC}"

# Step 3: Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "\n${BLUE}Current branch: $CURRENT_BRANCH${NC}"

# Step 4: Compare branches
echo -e "\n${YELLOW}Step 3: Comparing branches...${NC}"
echo -e "${BLUE}Branch comparison:${NC}"
git log --oneline --graph --left-right --boundary "origin/$DEFAULT_BRANCH...HEAD" || echo "No divergence"

# Count commits
AHEAD=$(git rev-list --count "origin/$DEFAULT_BRANCH..HEAD" 2>/dev/null || echo "0")
BEHIND=$(git rev-list --count "HEAD..origin/$DEFAULT_BRANCH" 2>/dev/null || echo "0")

echo ""
echo -e "${BLUE}Summary:${NC}"
echo -e "  Ahead of $DEFAULT_BRANCH:  ${GREEN}$AHEAD commit(s)${NC}"
echo -e "  Behind $DEFAULT_BRANCH: ${YELLOW}$BEHIND commit(s)${NC}"

# Step 5: Check for conflicts
if [ "$BEHIND" -gt 0 ]; then
  echo -e "\n${YELLOW}Step 4: Checking for potential conflicts...${NC}"
  
  # Dry-run merge to check for conflicts
  if git merge-tree "$(git merge-base HEAD origin/$DEFAULT_BRANCH)" HEAD "origin/$DEFAULT_BRANCH" | grep -q "^changed in both"; then
    echo -e "${RED}⚠ Potential conflicts detected!${NC}"
    echo -e "${YELLOW}Files that may conflict:${NC}"
    git merge-tree "$(git merge-base HEAD origin/$DEFAULT_BRANCH)" HEAD "origin/$DEFAULT_BRANCH" | grep "^changed in both" || true
    CONFLICTS=true
  else
    echo -e "${GREEN}✓ No conflicts detected${NC}"
    CONFLICTS=false
  fi
  
  # Step 6: Offer to merge
  echo -e "\n${YELLOW}Step 5: Merging changes...${NC}"
  
  if [ "$AUTO_MERGE" = true ]; then
    MERGE_ANSWER="y"
  else
    echo -e "${BLUE}Do you want to merge origin/$DEFAULT_BRANCH into $CURRENT_BRANCH? (y/n)${NC}"
    read -r MERGE_ANSWER
  fi
  
  if [[ "$MERGE_ANSWER" =~ ^[Yy]$ ]]; then
    if git merge "origin/$DEFAULT_BRANCH" --no-edit; then
      echo -e "${GREEN}✓ Successfully merged origin/$DEFAULT_BRANCH${NC}"
    else
      echo -e "${RED}✗ Merge failed - conflicts need to be resolved manually${NC}"
      echo -e "${YELLOW}To abort the merge: git merge --abort${NC}"
      exit 1
    fi
  else
    echo -e "${YELLOW}Merge skipped${NC}"
  fi
else
  echo -e "\n${GREEN}✓ Branch is up to date with origin/$DEFAULT_BRANCH${NC}"
fi

echo -e "\n${GREEN}=== Sync complete ===${NC}"
