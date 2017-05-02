function makeTodayDiary() {  
  var prop = PropertiesService.getScriptProperties().getProperties();
  const date = new Date();
  
  var option = { name: prop.NAME, email: prop.EMAIL };
  var github = new GitHubAPI.GitHubAPI(prop.GITHUB_USERNAME, prop.GITHUB_REPO, prop.GITHUB_TOKEN, option);
  
  var branch = github.getBranch(prop.GITHUB_BRANCH);
  var pTree = github.getTree(branch['commit']['commit']['tree']['sha']);
  var blob = github.createBlob('# ' + Utilities.formatDate(date, option.tz, "yyyy/MM/dd (EEE)"));
  var data = {
    'tree': pTree['tree'].concat([{
      'path': 'diary/' + Utilities.formatDate(date, option.tz, "yyyy/MM/dd") + '.md',
      'mode': '100644',
      'type': 'blob',
      'sha': blob['sha']
    }])
  };
  var tree = github.createTree(data);
  var commit = github.createCommit('commit!!', tree['sha'], branch['commit']['sha']);
  var result = github.updateReference(prop.GITHUB_BRANCH, commit['sha']);
  Logger.log(result);
}