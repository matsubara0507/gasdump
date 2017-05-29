function doPost(e) {  
  var prop = PropertiesService.getScriptProperties().getProperties();
  
  var jsonString = e.postData.getDataAsString();
  var jsonData = JSON.parse(jsonString);
  
  if (jsonData['action'] != 'closed' 
      || jsonData['pull_request']['head']['ref'] != prop.GITHUB_WRITE_BRANCH 
      || jsonData['pull_request']['base']['ref'] != prop.GITHUB_READ_BRANCH) {
    return;
  }
  
  const date = new Date(jsonData['pull_request']['title'])
  Logger.log(postSnippetToSlack(date, prop));
  
  var option = { name: prop.NAME, email: prop.EMAIL };
  var github = new GitHubAPI.GitHubAPI(prop.GITHUB_USERNAME, prop.GITHUB_REPO, prop.GITHUB_TOKEN, option);
  Logger.log(createEmptyCommit(github, prop))
  Logger.log(createTodayPullRequest(date, github, prop));
}

function postSnippetToSlack(date, prop) {
  const params = { headers : { Authorization: 'token ' + prop.GITHUB_TOKEN } };
  const filepath = Utilities.formatDate(date, Session.getScriptTimeZone(), "'diary/'yyyy/MM/dd'.md'")
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

function createEmptyCommit(github, prop) {
  var branch = github.getBranch(prop.GITHUB_WRITE_BRANCH);
  var pTree = github.getTree(branch['commit']['commit']['tree']['sha']);
  var data = { 'tree': pTree['tree'] };
  var tree = github.createTree(data);
  var commit = github.createCommit('empty commit!', tree['sha'], branch['commit']['sha']);
  return github.updateReference(prop.GITHUB_WRITE_BRANCH, commit['sha']);
}

function createTodayPullRequest(date, github, prop) {
  const previousDay = new Date(date.getTime() + 24 * 60 * 60 * 1000);
  var title = Utilities.formatDate(previousDay, Session.getScriptTimeZone(), "yyyy/M/d");  
  return github.createPullRequest(title, prop.GITHUB_WRITE_BRANCH, prop.GITHUB_READ_BRANCH);
}