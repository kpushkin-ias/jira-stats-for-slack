#!/bin/bash

# Deployment Script
# 
# This script creates a temporary dist folder, processes main.js to replace
# credential placeholders with actual values from secrets.local.txt,
# and deploys to Google Apps Script.
# 
# Usage:
#   npm run deploy
#   ./scripts/deploy.sh

set -e  # Exit on any error

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SECRETS_FILE="$PROJECT_ROOT/secrets.local.txt"
SRC_DIR="$PROJECT_ROOT/src"
DIST_DIR="$PROJECT_ROOT/dist"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Debug function
debug() {
    if [[ "$DEBUG" == "1" ]]; then
        echo -e "${YELLOW}[DEBUG]${NC} $1"
    fi
}

echo -e "${GREEN}=== Deployment ===${NC}"

# Check if secrets file exists
if [[ ! -f "$SECRETS_FILE" ]]; then
    echo -e "${RED}Error: secrets.local.txt not found${NC}"
    echo "Please create secrets.local.txt from secrets.template.txt and fill in your credentials"
    echo "Example:"
    echo "  cp secrets.template.txt secrets.local.txt"
    echo "  # Edit secrets.local.txt with your actual credentials"
    exit 1
fi

# Create dist directory
echo "Creating dist directory..."
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# Read secrets and process main.js
echo "Reading secrets from $SECRETS_FILE..."

# Initialize variables
JIRA_DOMAIN=""
EMAIL=""
API_TOKEN=""

# Parse secrets file
while IFS= read -r line || [[ -n "$line" ]]; do
    # Skip empty lines and comments
    if [[ -z "$line" ]] || [[ "$line" =~ ^[[:space:]]*# ]]; then
        continue
    fi
    
    # Parse key=value pairs
    if [[ "$line" =~ ^[[:space:]]*([^=]+)=(.*)$ ]]; then
        key="${BASH_REMATCH[1]}"
        value="${BASH_REMATCH[2]}"
        
        # Trim whitespace
        key=$(echo "$key" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
        value=$(echo "$value" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
        
        debug "Found $key=$value"
        
        case "$key" in
            "JIRA_DOMAIN")
                JIRA_DOMAIN="$value"
                ;;
            "EMAIL")
                EMAIL="$value"
                ;;
            "API_TOKEN")
                API_TOKEN="$value"
                ;;
        esac
    fi
done < "$SECRETS_FILE"

# Validate that all secrets were found
if [[ -z "$JIRA_DOMAIN" ]] || [[ -z "$EMAIL" ]] || [[ -z "$API_TOKEN" ]]; then
    echo -e "${RED}Error: Missing required secrets${NC}"
    echo "Required: JIRA_DOMAIN, EMAIL, API_TOKEN"
    echo "Found:"
    echo "  JIRA_DOMAIN: ${JIRA_DOMAIN:-'(not set)'}"
    echo "  EMAIL: ${EMAIL:-'(not set)'}"
    echo "  API_TOKEN: ${API_TOKEN:+'(set)'}${API_TOKEN:-'(not set)'}"
    exit 1
fi

echo "Processing main.js with credentials..."

# Escape special characters for sed
JIRA_DOMAIN_ESCAPED=$(printf '%s\n' "$JIRA_DOMAIN" | sed 's/[[\.*^$()+?{|]/\\&/g')
EMAIL_ESCAPED=$(printf '%s\n' "$EMAIL" | sed 's/[[\.*^$()+?{|]/\\&/g')
API_TOKEN_ESCAPED=$(printf '%s\n' "$API_TOKEN" | sed 's/[[\.*^$()+?{|]/\\&/g')

# Replace placeholders in main.js
sed \
    -e "s/{{JIRA_DOMAIN}}/$JIRA_DOMAIN_ESCAPED/g" \
    -e "s/{{EMAIL}}/$EMAIL_ESCAPED/g" \
    -e "s/{{API_TOKEN}}/$API_TOKEN_ESCAPED/g" \
    "$SRC_DIR/main.js" > "$DIST_DIR/main.js"

echo "Credentials successfully embedded in main.js"

# Verify deployment files are ready
if grep -q "{{.*}}" "$DIST_DIR/main.js"; then
    echo -e "${RED}ERROR: Found unprocessed placeholders in main.js!${NC}"
    exit 1
fi

# Check if .clasp.json exists in dist, create project if needed
if [[ ! -f "$DIST_DIR/.clasp.json" ]]; then
    echo "No .clasp.json found in dist directory, creating new Apps Script project..."
    
    # Get project name from repository folder name and git commit hash
    REPO_NAME=$(basename "$PROJECT_ROOT")
    COMMIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    PROJECT_TITLE="$REPO_NAME-$COMMIT_HASH"
    
    echo "Creating new Apps Script project: $PROJECT_TITLE"
    clasp create --title "$PROJECT_TITLE" --type 'sheets' --rootDir "$DIST_DIR"
fi

# Deploy to Google Apps Script
echo "Deploying to Google Apps Script..."
clasp -P "$DIST_DIR/" push

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo
echo "Next steps:"
echo "  - Open the Google Apps Script project and manually run the updateJiraStats function"
echo "  npm run logs   - View execution logs"
echo "  npm run open   - Open the project in Apps Script editor"
echo "  npm run clean  - Remove the dist directory"