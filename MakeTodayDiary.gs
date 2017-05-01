function makeTodayDiary() {
  var prop = PropertiesService.getScriptProperties().getProperties();
  const username = prop.GITHUB_USERNAME;
  const repo = prop.GITHUB_REPO;
  const baseUrl = 'https://api.github.com/repos/' + username + '/' + repo
  Logger.log(getParentSha1(baseUrl, prop));
}

function getParentSha1(baseUrl, prop) {
  const branch = prop.GITHUB_BRANCH;
  var response = UrlFetchApp.fetch(baseUrl + '/branches/' + branch, {
    headers: {
      Authorization: 'token ' + prop.GITHUB_TOKEN
    }
  });
  return JSON.parse(response)['commit']['sha'];
}
