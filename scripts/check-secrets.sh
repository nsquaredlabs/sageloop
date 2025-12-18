#!/bin/bash
#
# Secrets Scanner for Local Development
#
# This script scans for hardcoded secrets before committing.
# Install gitleaks: https://github.com/gitleaks/gitleaks
#
# Usage:
#   ./scripts/check-secrets.sh           # Scan staged files
#   ./scripts/check-secrets.sh --all     # Scan all files
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔒 Scanning for hardcoded secrets..."

# Check if gitleaks is installed
if ! command -v gitleaks &> /dev/null; then
    echo -e "${YELLOW}⚠️  gitleaks is not installed${NC}"
    echo ""
    echo "Install it with:"
    echo "  macOS:   brew install gitleaks"
    echo "  Linux:   https://github.com/gitleaks/gitleaks#installing"
    echo "  Docker:  docker pull zricethezav/gitleaks:latest"
    echo ""
    echo -e "${YELLOW}Skipping secrets scan...${NC}"
    exit 0
fi

# Determine what to scan
if [ "$1" = "--all" ]; then
    echo "Scanning all files in repository..."
    gitleaks detect --source . --config .gitleaks.toml --verbose
else
    echo "Scanning staged files..."

    # Get list of staged files
    STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

    if [ -z "$STAGED_FILES" ]; then
        echo -e "${GREEN}✅ No staged files to scan${NC}"
        exit 0
    fi

    # Scan staged files
    gitleaks detect --source . --config .gitleaks.toml --verbose --log-opts="--staged"
fi

# Check exit code
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ No secrets detected${NC}"
    exit 0
else
    echo -e "${RED}❌ Secrets detected!${NC}"
    echo ""
    echo "Please remove the detected secrets before committing."
    echo "If these are false positives, add them to .gitleaks.toml allowlist."
    exit 1
fi
