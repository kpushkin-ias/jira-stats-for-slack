#!/bin/bash

# JIRA Configuration Setup Script
# 
# This script reads JIRA credentials from secrets.local.txt and securely 
# stores them in Google Apps Script's PropertiesService.
# 
# Usage:
#   npm run setup
#   ./scripts/setup-config.sh

set -e  # Exit on any error

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SECRETS_FILE="$PROJECT_ROOT/secrets.local.txt"

# Debug mode flag
DEBUG=${DEBUG:-0}

# Debug function
debug() {
    if [ "$DEBUG" = "1" ]; then
        echo "[DEBUG] $*" >&2
    fi
}

echo "JIRA Configuration Setup"

# Check if secrets file exists
if [ ! -f "$SECRETS_FILE" ]; then
    echo "Error: secrets.local.txt file not found"
    echo "Create it with: cp secrets.template.txt secrets.local.txt"
    echo "Then edit with your JIRA credentials"
    exit 1
fi

debug "Found secrets file: $SECRETS_FILE"
echo "Reading configuration..."

# Read configuration from secrets file
JIRA_DOMAIN=""
EMAIL=""
API_TOKEN=""

# Read each line and parse key=value pairs
while IFS= read -r line || [[ -n "$line" ]]; do
    # Skip comments and empty lines
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ -z "$line" ]] && continue
    
    # Check if line contains =
    if [[ "$line" == *"="* ]]; then
        key="${line%%=*}"
        value="${line#*=}"
        
        # Remove whitespace
        key=$(echo "$key" | xargs)
        value=$(echo "$value" | xargs)
        
        debug "Read config: $key=$value"
        
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

# Validate configuration
if [ -z "$JIRA_DOMAIN" ] || [ -z "$EMAIL" ] || [ -z "$API_TOKEN" ]; then
    echo "Error: Missing required configuration fields"
    echo "Required: JIRA_DOMAIN, EMAIL, API_TOKEN"
    exit 1
fi

debug "JIRA_DOMAIN: $JIRA_DOMAIN"
debug "EMAIL: $EMAIL"
debug "API_TOKEN: ${API_TOKEN:0:10}..."

echo "Configuration validated"

# Change to project directory
cd "$PROJECT_ROOT"
debug "Working directory: $(pwd)"

echo "Deploying to Apps Script..."

# Deploy code
if ! clasp push; then
    echo "Deploy failed"
    echo "Try: clasp login"
    exit 1
fi

debug "clasp push completed successfully"
echo "Code deployed successfully"

echo "Configuring credentials..."

# Store credentials in Apps Script
debug "Storing credentials in PropertiesService..."
clasp run setJiraConfig -p "[\"$JIRA_DOMAIN\",\"$EMAIL\",\"$API_TOKEN\"]"

echo "Checking stored properties..."

# Verify properties were set
debug "Verifying stored configuration..."
clasp run getJiraConfig

echo "Setup complete"

debug "Setup script finished successfully"