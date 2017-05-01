function makeTodayDiary() {
  var prop = PropertiesService.getScriptProperties().getProperties();
  const username = prop.GITHUB_USERNAME;
  const repo = prop.GITHUB_REPO;
  const branch = prop.GITHUB_BRANCH;
  var url = 'https://api.github.com/repos/' + username + '/' + repo + '/branches/' + branch;
  var response = UrlFetchApp.fetch(url, {
    headers: {
      Authorization: 'token ' + prop.GITHUB_TOKEN
    }
  });
  Logger.log(JSON.parse(response));
}

