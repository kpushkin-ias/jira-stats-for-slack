# JIRA Stats for Slack

A comprehensive JIRA statistics dashboard for Google Sheets using Google Apps Script.

## 🏗️ Project Structure

```
├── src/                    # Apps Script source code
│   ├── main.js            # Main dashboard functionality (with placeholders)
│   └── appsscript.json    # Apps Script manifest
├── scripts/               # Deployment scripts
│   └── deploy.sh          # Deployment script that processes credentials
├── dist/                  # Temporary deployment folder (auto-generated, not in git)
│   ├── main.js            # Processed main.js with embedded credentials
│   └── appsscript.json    # Copied manifest
├── secrets.template.txt   # Credentials template
├── package.json          # NPM configuration
└── README.md             # This file
```

## � Prerequisites

1. **Install Node.js and npm** (if not already installed)

2. **Install Google Apps Script CLI (clasp):**
   ```bash
   npm install -g @google/clasp
   ```

3. **Login to clasp:**
   ```bash
   clasp login
   ```

##  Quick Start

1. **Setup credentials:**
   ```bash
   cp secrets.template.txt secrets.local.txt
   # Edit secrets.local.txt with your JIRA credentials
   ```

2. **Deploy:**
   ```bash
   npm run deploy  # Creates dist/, processes credentials, and deploys
   ```

3. **Run the function:**
   - Open the Google Apps Script project (`npm run open`)
   - Manually run the `updateJiraStats` function from the editor

## 📦 Available Scripts

- `npm run deploy` - Process credentials and deploy to Apps Script
- `npm run logs` - View Apps Script logs
- `npm run open` - Open Apps Script editor
- `npm run clean` - Remove temporary dist folder

## 🛡️ Security

- Credentials are stored in `secrets.local.txt` (not committed to git)
- During deployment, credentials are embedded into the deployed code in a temporary `dist/` folder
- The `dist/` folder is automatically ignored by git and can be cleaned up after deployment
- Source code in `src/` contains only placeholders, keeping credentials separate from source control

## 📚 Reference

Based on: https://hackernoon.com/writing-google-apps-script-code-locally-in-vscode
