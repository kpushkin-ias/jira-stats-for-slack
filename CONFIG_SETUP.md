# JIRA Configuration Setup

This project uses Google Apps Script's PropertiesService to securely store JIRA credentials, keeping sensitive information out of your source code.

## Setup Methods

### Option 1: Using NPM Scripts (Recommended)

1. **Create your secrets file:**
   ```bash
   cp secrets.template.txt secrets.local.txt
   ```

2. **Edit secrets.local.txt with your actual credentials:**
   ```
   JIRA_DOMAIN=yourcompany.atlassian.net
   EMAIL=your.email@company.com
   API_TOKEN=your_actual_jira_api_token
   ```

3. **Run the setup:**
   ```bash
   npm run setup
   ```

4. **Test your setup:**
   ```bash
   npm run run
   ```

### Option 2: Manual Setup in Apps Script Editor

1. **Push your code:**
   ```bash
   clasp push
   ```

2. **Open Apps Script editor:**
   ```bash
   clasp open
   ```

3. **Call `setJiraConfig()` function** with your actual credentials:
   ```javascript
   setJiraConfig('your-domain.atlassian.net', 'your-email@company.com', 'your-api-token')
   ```

4. **Run the function once** from the editor console

## Security Features

- ✅ **Credentials stored in PropertiesService** - Google's encrypted storage
- ✅ **No secrets in source code** - Safe to commit to version control
- ✅ **Local files ignored** - .gitignore prevents accidental commits
- ✅ **One-time setup** - Credentials persist between deployments

## Getting JIRA API Token

1. Go to: https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Give it a name like "Google Apps Script JIRA Stats"
4. Copy the token (save it securely, you won't see it again)

## NPM Scripts Available

```bash
# Setup and configuration
npm run setup                 # Complete setup (deploy + configure secrets)
npm run setup-and-deploy      # Same as setup

# Development workflow  
npm run deploy                # Deploy code changes (clasp push)
npm run run                   # Execute updateJiraStats function
npm run logs                  # Check execution logs
npm run open                  # Open Apps Script editor in browser

# Full development cycle
npm run dev                   # Setup + deploy + run (complete workflow)
```

## Traditional clasp Commands (still work)

```bash
clasp push                    # Deploy code changes
clasp run updateJiraStats     # Run your function  
clasp logs                    # Check logs
clasp open                    # Open editor
```

## Troubleshooting

### "JIRA configuration not found" error
- Run the setup script again: `npm run setup`
- Or manually call `setJiraConfig()` in the Apps Script editor

### "Authorization failed" error  
- Check your JIRA domain, email, and API token are correct
- Ensure your API token hasn't expired
- Verify you have access to the JIRA projects (SYS, CRE, KUBE)

### Clasp authentication issues
```bash
clasp login    # Re-authenticate with Google
clasp push     # Try pushing again
```