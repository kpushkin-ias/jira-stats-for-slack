# JIRA Stats for Slack

A comprehensive JIRA statistics dashboard for Google Sheets using Google Apps Script.

## 🏗️ Project Structure

```
├── src/                    # Apps Script source code
│   ├── main.js            # Main dashboard functionality  
│   ├── appsscript.json    # Apps Script manifest
│   └── README.md          # Source code documentation
├── scripts/               # Setup and deployment scripts
│   ├── setup-config.sh    # Shell setup script
│   └── setup-config.js    # Node.js setup script
├── secrets.template.txt   # Credentials template
├── package.json          # NPM configuration
├── .clasp.json           # Clasp configuration (points to src/)
├── .claspignore          # Files to exclude from deployment
└── README.md             # This file
```

## 🚀 Quick Start

1. **Setup credentials:**
   ```bash
   cp secrets.template.txt secrets.local.txt
   # Edit secrets.local.txt with your JIRA credentials
   ```

2. **Run setup:**
   ```bash
   npm run setup
   ```

3. **Deploy and run:**
   ```bash
   npm run deploy
   npm run run
   ```

## 📦 Available Scripts

- `npm run setup` - Configure JIRA credentials and deploy
- `npm run deploy` - Deploy src/ to Apps Script
- `npm run run` - Execute the dashboard update
- `npm run logs` - View Apps Script logs
- `npm run open` - Open Apps Script editor

## 🛡️ Security

Credentials are stored securely in Google Apps Script's PropertiesService, not in the code.

## 📚 Reference

Based on: https://hackernoon.com/writing-google-apps-script-code-locally-in-vscode
