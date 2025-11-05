// === JIRA Configuration ===
// Credential placeholders - will be replaced during deployment
var JIRA_DOMAIN = '{{JIRA_DOMAIN}}';
var EMAIL = '{{EMAIL}}';
var API_TOKEN = '{{API_TOKEN}}';

// === Team Members Filter ===
var TEAM_MEMBERS = [
  'Acezell Ponce De Leon',
  'Ade Adebanjo',
  'Aniket Rane',
  'Ben Gittins',
  'Danny Rathjens',
  'Deepankar Pundale',
  'Hang Chan',
  'Jin Xu',
  'Joe Boyer Jr',
  'Joe Zancocchio',
  'Kirill Pushkin',
  'Lovish Setia',
  'Manasa Kandikonda',
  'Mat Sharpe',
  'Md Sakib',
  'Mohammed Khan',
  'Mukesh Prajapati',
  'Ninad Chhatre',
  'Robert Coones',
  'Sowmya Dontha'
];

// === Time Constants ===
var ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// === Configuration Management ===
// Credentials are embedded during deployment

// === Highlighting Colors ===
var HIGHLIGHT_BACKGROUND_COLOR = '#FFFF00'; // Yellow background
var HIGHLIGHT_FONT_COLOR = '#000000';       // Black text
var NORMAL_BACKGROUND_COLOR = '#FFFFFF';    // White background
var NORMAL_FONT_COLOR = '#000000';          // Black text

// === Stale Tickets Configuration ===
var STALE_TICKET_HIGHLIGHT_DAYS = 30;      // Highlight tickets past due more than this many days
var STALE_TICKET_HIGHLIGHT_COLOR = '#FFFF00'; // Yellow background for very overdue tickets (consistent with OpsTickets)

/**
 * Main function to update all Jira ticket statistics
 */
function updateJiraStats() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('OpsTickets');
  if (!sheet) {
    Logger.log('Sheet "OpsTickets" not found - creating it...');
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('OpsTickets');
  }

  try {
    Logger.log('=== Fetching Jira Ticket Statistics ===');
    
    // Get all statistics in optimized calls
    var statsResult = getAllTicketStats();
    var dueDateResult = getDueDateStats();
    var stats = statsResult.counts;
    var ticketDetails = statsResult.details;
    var dueDateStats = dueDateResult.counts;
    var dueDateDetails = dueDateResult.details;
    
    // Clear sheet completely (contents, formatting, highlights, formulas)
    sheet.clear();
    
    // Add title and description
    sheet.appendRow(['📊 JIRA Team Activity Dashboard - Last 7 Days']);
    sheet.appendRow(['']);
    sheet.appendRow(['📝 Field Descriptions:']);
    sheet.appendRow(['• Tickets Created: All tickets created by team member (last week)']);
    sheet.appendRow(['• Self-Assigned: Tickets assigned to user, created by themselves']);
    sheet.appendRow(['• Cross-Assigned: Tickets assigned to user, created by others']);
    sheet.appendRow(['• Cross-Actioned: Cross-assigned tickets closed/updated by this user']);
    sheet.appendRow(['• Cross-Overdue: All overdue tickets assigned to this user']);
    sheet.appendRow(['• Cross-Due Soon: All tickets assigned to this user due within 7 days']);
    sheet.appendRow(['• Total Activity: Created + Cross-Actioned']);
    sheet.appendRow(['']);
    sheet.appendRow(['🎨 Highlighting Rules (Yellow Background):']);
    sheet.appendRow(['• Cross-Actioned = 0 AND Cross-Overdue > 0 AND Tickets Created = 0']);
    sheet.appendRow(['• (No action on cross-assigned tickets, has overdue work, not creating new tickets)']);
    sheet.appendRow(['']);
    
    // Add column headers
    sheet.appendRow(['Team Member', 'Tickets Created', 'Self-Assigned', 'Cross-Assigned', 'Cross-Actioned', 'Cross-Overdue', 'Cross-Due Soon', 'Total Activity']);
    
    // Make header row bold
    var headerRowNum = sheet.getLastRow();
    var headerRange = sheet.getRange(headerRowNum, 1, 1, 8);
    headerRange.setFontWeight('bold');
    
    // Add data for each team member (show all team members, even with zero activity)
    TEAM_MEMBERS.sort().forEach(function(user) {
      var created = stats.created[user] || 0;
      var selfAssigned = stats.selfAssigned[user] || 0;
      var crossAssigned = stats.crossAssigned[user] || 0;
      var crossActioned = stats.crossActioned[user] || 0;
      // Cross-Overdue and Cross-Due Soon are counted for assignees (people who need to act)
      var overdue = dueDateStats.overdue[user] || 0;
      var dueSoon = dueDateStats.dueSoon[user] || 0;
      var total = created + crossActioned;
      
      // Add row with numbers
      sheet.appendRow([user, created, selfAssigned, crossAssigned, crossActioned, overdue, dueSoon, total]);
      
      // Add comments to cells with ticket details
      var rowNum = sheet.getLastRow();
      addTicketCommentToCell(sheet, rowNum, 2, ticketDetails.created[user], 'Tickets Created'); // Column B
      addTicketCommentToCell(sheet, rowNum, 3, ticketDetails.selfAssigned[user], 'Self-Assigned'); // Column C
      addTicketCommentToCell(sheet, rowNum, 4, ticketDetails.crossAssigned[user], 'Cross-Assigned'); // Column D
      addTicketCommentToCell(sheet, rowNum, 5, ticketDetails.crossActioned[user], 'Cross-Actioned'); // Column E
      addTicketCommentToCell(sheet, rowNum, 6, dueDateDetails.overdue[user], 'Cross-Overdue'); // Column F
      addTicketCommentToCell(sheet, rowNum, 7, dueDateDetails.dueSoon[user], 'Cross-Due Soon'); // Column G
    });
    
    // Right-align all numeric columns (columns 2-8)
    var dataRowStart = headerRowNum + 1;
    var dataRowCount = TEAM_MEMBERS.length;
    if (dataRowCount > 0) {
      var numericRange = sheet.getRange(dataRowStart, 2, dataRowCount, 7); // Columns B-H (2-8)
      numericRange.setHorizontalAlignment('right');
    }
    
    // Apply highlighting for rows with zero values in specified columns
    highlightZeroValueRowsWithStats(sheet, stats, dueDateStats);
    
    // Get and display stale tickets in separate table
    var staleTickets = getStaleTickets();
    if (staleTickets.length > 0) {
      var staleSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('StaleTickets');
      if (!staleSheet) {
        staleSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('StaleTickets');
      }
      
      staleSheet.clear();
      staleSheet.appendRow(['🚨 Team Members - Tickets Past Due Date']);
      staleSheet.appendRow(['🎨 Tickets highlighted in yellow are overdue more than ' + STALE_TICKET_HIGHLIGHT_DAYS + ' days']);
      staleSheet.appendRow(['']);
      staleSheet.appendRow(['Ticket Key', 'Summary', 'Creator', 'Assignee', 'Status', 'Priority', 'Created', 'Due Date', 'Last Updated', 'Days Past Due']);
      
      // Make header row bold
      var staleHeaderRowNum = staleSheet.getLastRow();
      var staleHeaderRange = staleSheet.getRange(staleHeaderRowNum, 1, 1, 10);
      staleHeaderRange.setFontWeight('bold');
      
      staleTickets.forEach(function(ticket, index) {
        // Create hyperlink formula for the ticket key
        var ticketUrl = 'https://' + JIRA_DOMAIN + '/browse/' + ticket.key;
        var ticketKeyFormula = '=HYPERLINK("' + ticketUrl + '","' + ticket.key + '")';
        
        // Add the row data with hyperlink formula in first column
        staleSheet.appendRow([
          ticketKeyFormula,
          ticket.summary,
          ticket.creator,
          ticket.assignee,
          ticket.status,
          ticket.priority,
          ticket.created,
          ticket.dueDate,
          ticket.lastUpdated,
          ticket.daysPastDue
        ]);
      });
      
      // Highlight tickets that are overdue more than the configured number of days
      var dataStartRow = staleHeaderRowNum + 1;
      staleTickets.forEach(function(ticket, index) {
        if (ticket.daysPastDue > STALE_TICKET_HIGHLIGHT_DAYS) {
          var rowNum = dataStartRow + index;
          var rowRange = staleSheet.getRange(rowNum, 1, 1, 10); // All 10 columns
          rowRange.setBackground(STALE_TICKET_HIGHLIGHT_COLOR);
          rowRange.setFontColor(HIGHLIGHT_FONT_COLOR);
        }
      });
      
      // Auto-resize all columns to fit their content
      staleSheet.autoResizeColumns(1, staleSheet.getLastColumn());
      
      Logger.log('Found ' + staleTickets.length + ' stale cross-assigned tickets');
    } else {
      Logger.log('No stale cross-assigned tickets found');
    }
    
    Logger.log('=== Statistics Updated Successfully ===');
    
  } catch (error) {
    Logger.log('Error updating statistics: ' + error.toString());
  }
}

/**
 * Add a comment to a cell with ticket details
 */
function addTicketCommentToCell(sheet, row, column, tickets, categoryName) {
  if (!tickets || tickets.length === 0) {
    return; // No comment needed for empty ticket lists
  }
  
  var commentText = categoryName + ' (' + tickets.length + '):\n\n';
  
  tickets.forEach(function(ticket, index) {
    if (index > 0) commentText += '\n';
    
    // Format: 🎫 KEY - Summary [Status] (Creator→Assignee) Priority [Due: Date]
    var line = '🎫 ' + ticket.key + ' - ' + ticket.summary;
    line += ' [' + ticket.status + ']';
    line += ' (' + ticket.creator + '→' + ticket.assignee + ')';
    line += ' ' + ticket.priority;
    
    if (ticket.dueDate) {
      line += ' [Due: ' + ticket.dueDate + ']';
    }
    
    commentText += line;
  });
  
  // Add the comment to the cell
  var cell = sheet.getRange(row, column);
  cell.setNote(commentText);
}

/**
 * Helper function to make JIRA API requests
 */
function makeJiraRequest(jql) {
  var encoded_jql = encodeURIComponent(jql);
  var url = 'https://' + JIRA_DOMAIN + '/rest/api/2/search/jql?jql=' + encoded_jql + '&fields=*all&maxResults=1000';

  var headers = {
    'Authorization': 'Basic ' + Utilities.base64Encode(EMAIL + ':' + API_TOKEN),
    'Accept': 'application/json'
  };

  var options = {
    'method': 'get',
    'headers': headers,
    'muteHttpExceptions': true
  };

  Logger.log('Searching with JQL: ' + jql);
  
  var response = UrlFetchApp.fetch(url, options);
  var data = JSON.parse(response.getContentText());

  if (!data.issues || !Array.isArray(data.issues)) {
    Logger.log('Jira API did not return an issues array. Full response:');
    Logger.log(JSON.stringify(data));
    throw new Error('Jira API error');
  }

  return data.issues;
}

/**
 * Get stale cross-assigned tickets that are past their due date
 */
function getStaleTickets() {
  // Query for open tickets that are past due date (matches getDueDateStats logic)
  var jql = 'project IN (SYS, CRE, KUBE) AND status NOT IN (Closed, Completed, Done, Resolved) AND duedate IS NOT EMPTY AND duedate <= now()';
  var issues = makeJiraRequest(jql);
  
  var staleTickets = [];
  
  Logger.log('Found ' + issues.length + ' overdue tickets total');
  
  issues.forEach(function(issue) {
    var creator = issue.fields.creator ? issue.fields.creator.displayName : 'Unknown';
    var assignee = issue.fields.assignee ? issue.fields.assignee.displayName : 'Unassigned';
    
    // Include overdue tickets assigned to team members (regardless of who created them)
    if (assignee && TEAM_MEMBERS.includes(assignee)) {
      
      var dueDate = issue.fields.duedate ? new Date(issue.fields.duedate) : null;
      var daysPastDue = 0;
      
      if (dueDate) {
        daysPastDue = Math.floor((Date.now() - dueDate.getTime()) / (24 * 60 * 60 * 1000));
      }
      
      staleTickets.push({
        key: issue.key,
        summary: issue.fields.summary,
        creator: creator,
        assignee: assignee,
        status: issue.fields.status.name,
        priority: issue.fields.priority ? issue.fields.priority.name : 'None',
        created: new Date(issue.fields.created).toLocaleDateString(),
        dueDate: dueDate ? dueDate.toLocaleDateString() : 'No Due Date',
        lastUpdated: new Date(issue.fields.updated).toLocaleDateString(),
        daysPastDue: daysPastDue
      });
    } else {
      // Log why tickets are being filtered out (for debugging)
      if (!assignee || assignee === 'Unassigned') {
        Logger.log('Filtered out unassigned ticket: ' + issue.key);
      } else if (!TEAM_MEMBERS.includes(assignee)) {
        Logger.log('Filtered out - assignee not in team: ' + issue.key + ' (assignee: ' + assignee + ')');
      }
    }
  });
  
  Logger.log('Returning ' + staleTickets.length + ' stale cross-assigned tickets after filtering');
  return staleTickets;
}

/**
 * Get due date statistics for open tickets
 */
function getDueDateStats() {
  // Query for all open tickets with due dates
  var jql = 'project IN (SYS, CRE, KUBE) AND status NOT IN (Closed, Completed, Done, Resolved) AND duedate IS NOT EMPTY';
  var issues = makeJiraRequest(jql);
  
  var dueDateStats = {
    overdue: {},
    dueSoon: {}
  };
  
  var dueDateDetails = {
    overdue: {},
    dueSoon: {}
  };
  
  // Initialize arrays for each user
  TEAM_MEMBERS.forEach(function(user) {
    dueDateDetails.overdue[user] = [];
    dueDateDetails.dueSoon[user] = [];
  });
  
  var now = new Date();
  var sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
  
  issues.forEach(function(issue) {
    var creator = issue.fields.creator ? issue.fields.creator.displayName : 'Unknown';
    var assignee = issue.fields.assignee ? issue.fields.assignee.displayName : 'Unassigned';
    
    // Count overdue/due-soon tickets for all team members (regardless of creator)
    if (assignee && TEAM_MEMBERS.includes(assignee)) {
      
      var dueDate = new Date(issue.fields.duedate);
      var ticketInfo = {
        key: issue.key,
        summary: issue.fields.summary,
        creator: creator,
        assignee: assignee,
        status: issue.fields.status.name,
        priority: issue.fields.priority ? issue.fields.priority.name : 'None',
        dueDate: dueDate.toLocaleDateString()
      };
      
      if (dueDate <= now) {
        // Ticket assigned to team member is overdue
        dueDateStats.overdue[assignee] = (dueDateStats.overdue[assignee] || 0) + 1;
        dueDateDetails.overdue[assignee].push(ticketInfo);
      } else if (dueDate <= sevenDaysFromNow) {
        // Ticket assigned to team member is due within next 7 days
        dueDateStats.dueSoon[assignee] = (dueDateStats.dueSoon[assignee] || 0) + 1;
        dueDateDetails.dueSoon[assignee].push(ticketInfo);
      }
    }
  });
  
  return {
    counts: dueDateStats,
    details: dueDateDetails
  };
}

/**
 * Get all ticket statistics in one optimized function
 */
function getAllTicketStats() {
  // Single query to get all relevant tickets from last week
  var jql = 'project IN (SYS, CRE, KUBE) AND (created >= -1w OR updated >= -1w OR resolved >= -1w)';
  var issues = makeJiraRequest(jql);
  
  var stats = {
    created: {},
    selfAssigned: {},     // Tickets assigned to user, created by user
    crossAssigned: {},    // Tickets assigned to user, created by others
    crossActioned: {}     // Cross-assigned tickets closed or updated by user
  };
  
  var ticketDetails = {
    created: {},
    selfAssigned: {},
    crossAssigned: {},
    crossActioned: {}
  };
  
  // Initialize arrays for each user
  TEAM_MEMBERS.forEach(function(user) {
    ticketDetails.created[user] = [];
    ticketDetails.selfAssigned[user] = [];
    ticketDetails.crossAssigned[user] = [];
    ticketDetails.crossActioned[user] = [];
  });
  
  issues.forEach(function(issue) {
    var creator = issue.fields.creator ? issue.fields.creator.displayName : 'Unknown';
    var assignee = issue.fields.assignee ? issue.fields.assignee.displayName : 'Unassigned';
    
    var ticketInfo = {
      key: issue.key,
      summary: issue.fields.summary,
      creator: creator,
      assignee: assignee,
      status: issue.fields.status.name,
      priority: issue.fields.priority ? issue.fields.priority.name : 'None'
    };
    
    // Count created tickets (created in last week)
    if (new Date(issue.fields.created) >= new Date(Date.now() - ONE_WEEK_MS)) {
      if (creator && TEAM_MEMBERS.includes(creator)) {
        stats.created[creator] = (stats.created[creator] || 0) + 1;
        ticketDetails.created[creator].push(ticketInfo);
      }
      
      // Count assigned tickets from assignee perspective (created in last week)
      if (assignee && TEAM_MEMBERS.includes(assignee)) {
        if (creator === assignee) {
          // Self-assigned: assignee = user, creator = user
          stats.selfAssigned[assignee] = (stats.selfAssigned[assignee] || 0) + 1;
          ticketDetails.selfAssigned[assignee].push(ticketInfo);
        } else {
          // Cross-assigned: assignee = user, creator ≠ user
          stats.crossAssigned[assignee] = (stats.crossAssigned[assignee] || 0) + 1;
          ticketDetails.crossAssigned[assignee].push(ticketInfo);
        }
      }
    }
    
    // Count cross-assigned tickets that were closed or updated in last week
    if (creator !== assignee && 
        creator && TEAM_MEMBERS.includes(creator) && 
        assignee && TEAM_MEMBERS.includes(assignee)) {
      
      var wasActioned = false;
      
      // Check if closed in last week
      if (issue.fields.resolutiondate && 
          new Date(issue.fields.resolutiondate) >= new Date(Date.now() - ONE_WEEK_MS) &&
          (issue.fields.status.name === 'Closed' || issue.fields.status.name === 'Completed') &&
          (issue.fields.resolution && ['Done', 'Fixed', 'P&D Done'].includes(issue.fields.resolution.name))) {
        wasActioned = true;
      }
      
      // Check if updated in last week (and not already counted as closed)
      if (!wasActioned && new Date(issue.fields.updated) >= new Date(Date.now() - ONE_WEEK_MS)) {
        wasActioned = true;
      }
      
      // Count the action for the assignee (person who actioned it)
      if (wasActioned) {
        stats.crossActioned[assignee] = (stats.crossActioned[assignee] || 0) + 1;
        ticketDetails.crossActioned[assignee].push(ticketInfo);
      }
    }
  });
  
  return {
    counts: stats,
    details: ticketDetails
  };
}

/**
 * Function to highlight rows with zero values in specified columns (works with raw stats data)
 */
function highlightZeroValueRowsWithStats(sheet, stats, dueDateStats) {
  // Find the header row that contains "Team Member"
  var allData = sheet.getDataRange().getValues();
  var headerRowIndex = -1;
  
  for (var i = 0; i < allData.length; i++) {
    if (allData[i][0] === 'Team Member') {
      headerRowIndex = i;
      break;
    }
  }
  
  if (headerRowIndex === -1) {
    Logger.log('Header row not found');
    return;
  }
  
  var dataStartRow = headerRowIndex + 2; // +1 for header, +1 for 1-based indexing
  
  // Go through each team member and check their stats
  TEAM_MEMBERS.sort().forEach(function(user, index) {
    // Check highlighting conditions
    var created = stats.created[user] || 0;
    var crossActioned = stats.crossActioned[user] || 0;
    var overdue = dueDateStats.overdue[user] || 0;
    
    // Highlight if Cross-Actioned is zero AND has overdue tickets AND hasn't created any tickets
    var shouldHighlight = (crossActioned === 0 && overdue > 0 && created === 0);
    
    // Apply highlighting to the entire row
    var rowNum = dataStartRow + index;
    var rowRange = sheet.getRange(rowNum, 1, 1, sheet.getLastColumn());
    if (shouldHighlight) {
      rowRange.setBackground(HIGHLIGHT_BACKGROUND_COLOR);
      rowRange.setFontColor(HIGHLIGHT_FONT_COLOR);
    } else {
      rowRange.setBackground(NORMAL_BACKGROUND_COLOR);
      rowRange.setFontColor(NORMAL_FONT_COLOR);
    }
  });
}


