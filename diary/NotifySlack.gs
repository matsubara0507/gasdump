function doPost(e) {  
  var prop = PropertiesService.getScriptProperties().getProperties();
  
  var jsonString = e.postData.getDataAsString();
  var jsonData = JSON.parse(jsonString);
  
  if (jsonData['action'] != 'closed' 
      || jsonData['pull_request']['head']['ref'] != prop.GITHUB_WRITE_BRANCH 
      || jsonData['pull_request']['base']['ref'] != prop.GITHUB_READ_BRANCH) {
    /* Log */  
    var sheet = SpreadsheetApp.openById(prop.SPREAD_SHEET_ID).getSheetByName(prop.SHEET_NAME);
    var count = sheet.getRange(1, 1).getValue();
    sheet.getRange(count + 2, 1).setValue(jsonData['action']);
    sheet.getRange(count + 2, 2).setValue(jsonData['pull_request']['head']['ref']);
    sheet.getRange(count + 2, 3).setValue(jsonData['pull_request']['base']['ref']);
    sheet.getRange(1, 1).setValue(count + 1);
    return;
  }
  
  const date = new Date();
  const params = { headers : { Authorization: 'token ' + prop.GITHUB_TOKEN } };
  const filepath = Utilities.formatDate(date, Session.getScriptTimeZone(), "'diary/'yyyy/MM/01'.md'")
  const rawurl = 'https://raw.githubusercontent.com/';
  const ghurl = 'https://github.com/';
  const repourl = prop.GITHUB_USERNAME + '/' + prop.GITHUB_REPO + '/'
  const branchurl = prop.GITHUB_READ_BRANCH + '/'
  
  var text = UrlFetchApp.fetch(rawurl + repourl + branchurl + filepath, params);
  Logger.log(text);
   
  /* Post Message as Snippet to Slack */
  var data = {
    'token': prop.SLACK_API_TOKEN,
    'content': text,
    'filetype': 'markdown',
    'filename': filepath,
    'title': filepath,
    'initial_comment': ghurl + repourl + 'blob/' + branchurl + filepath,
    'channels': prop.SLACK_CHANNEL
  };
  var response = UrlFetchApp.fetch('https://slack.com/api/files.upload', { method: 'POST', payload: data} );
  Logger.log(response);
}
