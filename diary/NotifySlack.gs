function doPost(e) {  
  var prop = PropertiesService.getScriptProperties().getProperties();
  
  var jsonString = e.postData.getDataAsString();
  var jsonData = JSON.parse(jsonString);
  
  if (jsonData['action'] != 'closed' 
      || jsonData['pull_request']['head']['ref'] != prop.GITHUB_WRITE_BRANCH 
      || jsonData['pull_request']['base']['ref'] != prop.GITHUB_READ_BRANCH) {
    return;
  }
  
  const today = new Date();
  Logger.log(postSnippetToSlack(today, jsonDara, prop));
  
  var option = { name: prop.NAME, email: prop.EMAIL };
  var github = new GitHubAPI.GitHubAPI(prop.GITHUB_USERNAME, prop.GITHUB_REPO, prop.GITHUB_TOKEN, option);
  Logger.log(createTodayPullRequest(today, github, prop));
}

function postSnipeetToSlack(today, jsonData, prop) {
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const params = { headers : { Authorization: 'token ' + prop.GITHUB_TOKEN } };
  const filepath = Utilities.formatDate(yesterday, Session.getScriptTimeZone(), "'diary/'yyyy/MM/dd'.md'")
  const rawurl = 'https://raw.githubusercontent.com/';
  const ghurl = 'https://github.com/';
  const repourl = prop.GITHUB_USERNAME + '/' + prop.GITHUB_REPO + '/'
  const branchurl = prop.GITHUB_READ_BRANCH + '/'
  var text = UrlFetchApp.fetch(rawurl + repourl + branchurl + filepath, params);

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
  return  UrlFetchApp.fetch('https://slack.com/api/files.upload', { method: 'POST', payload: data} );
}

function createTodayPullRequest(today, github, prop) {
  var title = Utilities.formatDate(today, Session.getScriptTimeZone(), "yyyy年M月d日");  
  return github.createPullRequest(title, prop.GITHUB_WRITE_BRANCH, prop.GITHUB_READ_BRANCH);
}