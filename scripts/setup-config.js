#!/usr/bin/env node

/**
 * JIRA Configuration Setup Script
 * 
 * This script reads JIRA credentials from secrets.local.txt and securely 
 * stores them in Google Apps Script's PropertiesService.
 * 
 * Usage:
 *   npm run setup
 *   node scripts/setup-config.js
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const SECRETS_FILE = path.join(PROJECT_ROOT, 'secrets.local.txt');

console.log('JIRA Configuration Setup');

// Read configuration from secrets file
function readSecretsFile() {
  if (!fs.existsSync(SECRETS_FILE)) {
    console.error('Error: secrets.local.txt file not found');
    console.log('Create it with: cp secrets.template.txt secrets.local.txt');
    console.log('Then edit with your JIRA credentials');
    process.exit(1);
  }
  
  console.log('Reading configuration...');
  const content = fs.readFileSync(SECRETS_FILE, 'utf8');
  const config = {};
  
  content.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#') && line.includes('=')) {
      const [key, ...valueParts] = line.split('=');
      config[key.trim()] = valueParts.join('=').trim();
    }
  });
  
  return config;
}

// Validate configuration
function validateConfig(config) {
  const required = ['JIRA_DOMAIN', 'EMAIL', 'API_TOKEN'];
  const missing = required.filter(key => !config[key]);
  
  if (missing.length > 0) {
    console.error('Error: Missing required fields:', missing.join(', '));
    console.log('Please add them to secrets.local.txt');
    process.exit(1);
  }
  
  console.log('Configuration validated');
}

// Execute shell command with promise
function execAsync(command) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd: PROJECT_ROOT }, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stdout, stderr });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

// Main setup function
async function setup() {
  try {
    // Read and validate configuration
    const config = readSecretsFile();
    validateConfig(config);
    
    console.log('Deploying to Apps Script...');
    
    // Push main.js and other files to Apps Script
    try {
      await execAsync('clasp push');
      console.log('Code deployed successfully');
    } catch (pushResult) {
      console.error('Deploy failed:', pushResult.error.message);
      console.log('Try: clasp login');
      process.exit(1);
    }
    
    console.log('Configuring credentials...');
    
    // Try automated setup first
    try {
      const setupResult = await execAsync(`clasp run setJiraConfig -p '[\"${config.JIRA_DOMAIN}\",\"${config.EMAIL}\",\"${config.API_TOKEN}\"]'`);
      console.log('Credentials stored');
    } catch (setupError) {
      console.log('Automated setup failed, manual setup required:');
      console.log('1. Run: npm run open');
      console.log('2. In Apps Script editor console:');
      console.log(`   setJiraConfig('${config.JIRA_DOMAIN}', '${config.EMAIL}', '${config.API_TOKEN}')`);
      console.log('3. Press Enter when done...');
      
      // Wait for user confirmation
      await new Promise(resolve => {
        process.stdin.once('data', () => resolve());
      });
    }
    
    console.log('Verifying configuration...');
    
    try {
      const verifyResult = await execAsync('clasp run getJiraConfig');
      console.log('Credentials verified');
    } catch (verifyError) {
      console.error('Verification failed:', verifyError.error.message);
      console.log('Check manual setup or run: npm run open');
    }
    
    console.log('Testing JIRA connection...');
    
    try {
      const testResult = await execAsync('clasp run makeJiraRequest -p \'["project IN (SYS, CRE, KUBE) AND created >= -1d"]\'');
      console.log('JIRA connection successful');
    } catch (testError) {
      console.log('Connection test failed - check credentials manually with: npm run run');
    }
    
    console.log('Setup complete');
    console.log('Run with: npm run run');
    
  } catch (error) {
    console.error('Setup failed:', error.message);
    process.exit(1);
  }
}

// Handle command line execution
if (require.main === module) {
  setup();
}

module.exports = { setup };