# JIRA Team Activity Dashboard

📊 Google Apps Script application that generates team productivity dashboards in Google Sheets.

## What It Does

Creates two dashboards:
- **OpsTickets**: Team activity metrics (7 days) with yellow highlighting for inactive members with overdue work
- **StaleTickets**: Overdue tickets list with yellow highlighting for tickets overdue >30 days

## Prerequisites

- Google Apps Script access
- JIRA API token and permissions for SYS, CRE, KUBE projects  
- Node.js, `npm install -g @google/clasp`, `clasp login`

## Setup

1. **Configure credentials**:
   ```bash
   cp secrets.template.txt secrets.local.txt
   # Edit secrets.local.txt with your JIRA_DOMAIN, EMAIL, API_TOKEN
   ```

2. **Deploy**:
   ```bash
   npm run deploy
   ```

3. **Run**: Open Apps Script editor (`npm run open`) and run `updateJiraStats()` function

## Customization

**Team members**: Edit `TEAM_MEMBERS` array in `src/main.js`  
**Projects**: Change `project IN (SYS, CRE, KUBE)` in JQL queries  
**Stale highlighting**: Modify `STALE_TICKET_HIGHLIGHT_DAYS = 30` in `src/main.js`

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
