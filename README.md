# JIRA Team Activity Dashboard

📊 A comprehensive Google Apps Script application that generates team productivity dashboards in Google Sheets by analyzing JIRA ticket statistics and due date metrics.

## 🔍 What It Does

This application creates **two automated dashboards** in Google Sheets:

### 1. **OpsTickets Sheet** - Team Activity Dashboard (Last 7 Days)
Tracks team member productivity across multiple dimensions:

- **Tickets Created**: New tickets created by each team member
- **Self-Assigned**: Tickets assigned to the creator themselves  
- **Cross-Assigned**: Tickets assigned to team member, created by others
- **Cross-Actioned**: Cross-assigned tickets closed/updated by assignee
- **Cross-Overdue**: Overdue tickets currently assigned to team member
- **Cross-Due Soon**: Tickets due within next 7 days
- **Total Activity**: Created + Cross-Actioned tickets

**Smart Highlighting**: Automatically highlights team members in yellow who have:
- ⚠️ No action on cross-assigned tickets AND
- 🚨 Overdue tickets assigned to them AND  
- 🆕 No new tickets created

### 2. **StaleTickets Sheet** - Overdue Tickets Report
Lists all overdue tickets with detailed information:
- Ticket key (clickable links to JIRA)
- Summary, creator, assignee, status, priority
- Creation date, due date, last updated
- Days past due

## 🏗️ Project Structure

```
├── src/
│   └── main.js              # Main Google Apps Script code
├── scripts/
│   └── deploy.sh           # Deployment automation script  
├── secrets.template.txt     # JIRA credentials template
├── secrets.local.txt       # Your actual credentials (git-ignored)
├── dist/                   # Temporary build folder (auto-generated)
└── package.json            # Project configuration
```

## ⚙️ Configuration

### Team Members
The script monitors a predefined list of team members (configured in `TEAM_MEMBERS` array)

### JIRA Projects Monitored
- **SYS** - System tickets
- **CRE** - CRE project tickets  
- **KUBE** - Kubernetes-related tickets

## 🚀 Prerequisites

1. **Google Apps Script Environment**
   - Google account with access to Google Sheets
   - Google Apps Script project

2. **JIRA Access**
   - JIRA instance with API access
   - Email and API token for authentication
   - Permissions to read the monitored projects (SYS, CRE, KUBE)

3. **Development Tools**
   - **Node.js and npm** - Required for running deployment scripts
   - **Google Apps Script CLI (clasp)** - Essential for deploying and managing the project
     ```bash
     # Install clasp globally
     npm install -g @google/clasp
     
     # Authenticate with Google Apps Script
     clasp login
     ```

## 📋 Setup Instructions

### 1. **Configure JIRA Credentials**
```bash
# Copy template and edit with your credentials
cp secrets.template.txt secrets.local.txt

# Edit secrets.local.txt with your actual values:
# JIRA_DOMAIN=your-company.atlassian.net
# EMAIL=your-email@company.com  
# API_TOKEN=your-jira-api-token
```

### 2. **Deploy to Google Apps Script**
```bash
# Automated deployment (processes credentials and deploys)
npm run deploy

# Or run deployment script directly
./scripts/deploy.sh
```

### 3. **Run the Dashboard**
```bash
# Open the Google Apps Script editor
npm run open

# Or manually:
# 1. Go to script.google.com
# 2. Open your deployed project  
# 3. Run the updateJiraStats() function
```

## 🎮 Usage

### Manual Execution
1. Open Google Apps Script editor
2. Select the `updateJiraStats` function
3. Click "Run" button
4. Check Google Sheets for generated dashboards

### Automated Scheduling (Recommended)
1. In Apps Script editor, go to "Triggers" (clock icon)
2. Add new trigger for `updateJiraStats` function
3. Set schedule (e.g., daily at 9 AM)
4. Save trigger

### Viewing Results
- **OpsTickets sheet**: Team productivity dashboard with 7-day statistics
- **StaleTickets sheet**: Current overdue tickets requiring attention
- Hover over numbers to see detailed ticket information in tooltips

## 🔧 Deployment Process

The deployment script (`deploy.sh`) performs these steps:

1. **Validates credentials** exist in `secrets.local.txt`
2. **Creates temporary `dist/` folder**
3. **Processes `main.js`** - replaces credential placeholders with actual values
4. **Deploys to Google Apps Script** using clasp CLI
5. **Cleans up** temporary files

## 📊 Data Sources & Metrics

### Time Ranges
- **Activity metrics**: Last 7 days from current date
- **Due date metrics**: Current state (all open tickets)

### JQL Queries Used
The application uses optimized JIRA Query Language (JQL) to fetch:
- Recent ticket activity (`created >= -1w OR updated >= -1w OR resolved >= -1w`)
- Open tickets with due dates (`status NOT IN (Closed, Completed, Done, Resolved)`)
- Project scope (`project IN (SYS, CRE, KUBE)`)

## 🛡️ Security

- **Credentials**: Stored locally in `secrets.local.txt` (git-ignored)
- **Deployment**: Credentials embedded during build process only
- **Authentication**: Uses JIRA API tokens (not passwords)
- **Permissions**: Requires read-only JIRA access

## 📝 Customization

### Modify Team Members
Edit the `TEAM_MEMBERS` array in `src/main.js`:
```javascript
var TEAM_MEMBERS = [
  'Your Team Member 1',
  'Your Team Member 2'
  // Add your team members here
];
```

### Change Projects Monitored  
Update JQL queries in the script to include your JIRA projects:
```javascript
// Change from: project IN (SYS, CRE, KUBE)
// To: project IN (YOUR, PROJECTS, HERE)
```

### Adjust Highlighting Rules
Modify highlighting conditions in `highlightZeroValueRowsWithStats()` function.

## 🚨 Troubleshooting

### Common Issues

**"JIRA configuration not found or contains placeholders"**
- Ensure `secrets.local.txt` exists and contains valid credentials
- Run deployment script to embed credentials: `npm run deploy`

**"Jira API error" / Authentication failures**
- Verify JIRA domain format: `company.atlassian.net` (no https://)
- Check API token is valid and has correct permissions
- Ensure email matches the JIRA account

**Empty or incorrect data**
- Verify team member names match exactly with JIRA display names
- Check project keys (SYS, CRE, KUBE) exist in your JIRA instance
- Review Apps Script logs for detailed error messages

**Permission errors**
- Ensure Google Apps Script has permission to access Google Sheets
- Grant necessary JIRA project read permissions to API token user

### Getting API Token
1. Go to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Copy the generated token to `secrets.local.txt`

### Viewing Logs
```bash
# View Apps Script execution logs
npm run logs

# Or check directly in Apps Script editor (View → Logs)
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -am 'Add your feature'`
4. Push to branch: `git push origin feature/your-feature`  
5. Submit pull request

## 📄 License

Proprietary - See package.json for details

---

*Last updated: November 2024*  
*Author: Kiril Pushkin*

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
