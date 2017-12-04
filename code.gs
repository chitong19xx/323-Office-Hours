function Initialize() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i in triggers) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
  
  //Set a trigger when the form updates the spreadsheet to call our Slack notification function
  ScriptApp.newTrigger("CreateMessage")
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onFormSubmit()
    .create();
  ScriptApp.newTrigger("PostQueue").timeBased().everyMinutes(1).create();
}

/**
 * Open the correct spreadsheet and go to the "Today's Questions" page.
 */
function TodaySheet() {
  var spreadsheet = SpreadsheetApp.openById(SCRIPT_ID);
  spreadsheet = SpreadsheetApp.setActiveSheet(spreadsheet.getSheets()[0]);
  return spreadsheet;
}

/**
 * Manually entered text in later columns gets in the way of figuring out the last valid row.
 * Delete all rows that don't have a timestamp.
 */
function CleanupLastCol(spreadsheet) {
  var lastRow = spreadsheet.getLastRow();
  while (spreadsheet.getRange(lastRow, 1).getDisplayValue() == "") {
    // leftmost column (timestamp) of last row is empty
    // clear the entire last row
    spreadsheet.getRange(lastRow, 1, 1, spreadsheet.getLastColumn()).clearContent();
    var newLastRow = spreadsheet.getLastRow();
    if (newLastRow === lastRow) {
      Logger.log("Clearing last row didn't work. Last row is still " + lastRow);
      return;
    }
    lastRow = newLastRow;
  }
}

function FormatMessage(spreadsheet) {
  // find column names
  var columnNames = spreadsheet.getRange(1, 1, 1, 4).getDisplayValues()[0];
  var vals = spreadsheet.getRange(spreadsheet.getLastRow(), 1, 1, 4).getDisplayValues()[0];
  var message = "";
  for (var i = 1; i < vals.length; i++) { // skip timestamp column
    message += "*" + columnNames[i] + "* - " + vals[i] + "\n";
  }
  return message;
}

function unhelped(spreadsheet) {
  // count the number that have not been helped
  // "helped" is in column 5
  var helpedCol = spreadsheet.getRange(1, 5, spreadsheet.getLastRow(), 1);
  var nameCol = spreadsheet.getRange(1, 2, spreadsheet.getLastRow(), 1);
  var names = [];
  for (var i = 0; i < spreadsheet.getLastRow(); i++) {
    var helped = helpedCol.getDisplayValues()[i][0];
    var name = nameCol.getDisplayValues()[i][0];
    if (helped == "") {
      names.push(name);
    }
  }
  return names;
}

function countPeople(spreadsheet) {
  return unhelped(spreadsheet).length;
}

function spuriousCall(spreadsheet) {
  var props = PropertiesService.getScriptProperties();
  var currLastRow = "row " + spreadsheet.getLastRow(); // needs string
  var prevLastRow = props.getProperty("prevLastRow");
  props.setProperty("prevLastRow", currLastRow);
  if (prevLastRow != currLastRow) {
    return false;
  }
  Logger.log("Spurious call to CreateMessage because lastRow is still " + prevLastRow);
  return true;
}

function CreateMessage(e){
  // Due to a Google Scripts bug, this function gets called twice in parallel for each form submit.
  // Use locking and the check `spuriousCall` to ensure that it doesn't send two slack messages.
  LockService.getScriptLock().waitLock(1000);
  Logger.log("Create message acquired lock");
  try {
    var spreadsheet = TodaySheet();
    if (spuriousCall(spreadsheet)) return;
    CleanupLastCol(spreadsheet);
    PostQueue();
    var message = FormatMessage(spreadsheet);
    SendSlackMessage(message);
 
  } catch (e) {
    Logger.log(e.toString());
  }
  LockService.getScriptLock().releaseLock();
}
 
function TestSlack(){
  SendSlackMessage("testing my stuff"); 
}
 
function SendSlackMessage(message){
  var url = "https://slack.com/api/chat.postMessage";
   
  var payload =
      {
        "token" : SLACK_TOKEN,
        "as_user" :"true",
        "text" : "New Help Request:\n" + message,
        "channel" : "#notifs",
        "attachments" : [{"pretext": "Notification", "text": message}],
        "type" : "post",
      };
   
  var options =
      {
        "method"  : "POST",
        "payload" : payload,   
        "followRedirects" : false,
        "muteHttpExceptions": true
      };
   
  var result = UrlFetchApp.fetch(url, options);

  if (result.getResponseCode() == 200) {
    var params = JSON.parse(result.getContentText());
    
    Logger.log(params);
  }
}

function PostQueue(e) {
  var spreadsheet = TodaySheet();
  PostSizeChange(countPeople(spreadsheet));
  PostNewQueue(unhelped(spreadsheet));
}

function PostSizeChange(new_size) {
  var url = URL + "/change/" + new_size;
  var result = UrlFetchApp.fetch(url);
  if (result.getResponseCode() !== 200) {
    Logger.log("error on post size change with result " + result);
  }
}

function PostNewQueue(studentList) {
  var url = URL + "/set_list";
  var options =
      {
        "method"  : "POST",
        "contentType": "application/json",
        "payload" : JSON.stringify({"list": studentList}),
        "followRedirects" : false,
        "muteHttpExceptions": true
      };
  var result = UrlFetchApp.fetch(url, options);
  if (result.getResponseCode() !== 200) {
    Logger.log("error on post queue change with result " + result);
  }
}
