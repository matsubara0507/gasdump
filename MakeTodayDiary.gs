(function(exports) {
  var GitHubAPI;
  GitHubAPI = (function(){
    GitHubAPI.name = 'GitHubAPI';
    function GitHubAPI(userid, repo, token, option) {
      this.userid = userid;
      this.repo = repo;
      this.token = token;
      this.option = option != null ? option : {};
      
      if(!this.option.tz) this.option.tz = Session.getScriptTimeZone();
      
      this.BASE_URL = 'https://api.github.com/repos/';
      this.API_ENDPOINT = "" + this.BASE_URL + this.userid + '/' + this.repo;
    }
    GitHubAPI.prototype.runREST = function(method, endpoint, data) {
      var params;
      switch (method) {
        case 'GET':
          params = { headers : { Authorization: 'token ' + this.token } };
          break;
        case 'POST':
        case 'PATCH':
          params = {
            headers: {
              Authorization: 'token ' + this.token
            },
            method: method,
            contentType: 'application/json',
            payload: JSON.stringify(data)
          };
          break;
        default:
          throw 'undefined HTTP method: ' + method;
      }
      var response = UrlFetchApp.fetch(this.API_ENDPOINT + endpoint, params);
      return JSON.parse(response);
    };
    
    GitHubAPI.prototype.get = function(endpoint){ return this.runREST('GET', endpoint, null); };
    GitHubAPI.prototype.post = function(endpoint, data){ return this.runREST('POST', endpoint, data); };
    GitHubAPI.prototype.patch = function(endpoint, data){ return this.runREST('PATCH', endpoint, data); };
    
    GitHubAPI.prototype.toISOFormat = function(date, tz) {
      return Utilities.formatDate(date, tz, "yyyy-MM-dd'T'HH:mm:ssXXX");
    };
    
    GitHubAPI.prototype.getBranch = function(branchName) {
      return this.get('/branches/' + branchName);
    };
    GitHubAPI.prototype.createBlob = function(content) {
      return this.post('/git/blobs', { 'content': content, 'encoding': 'utf-8' });
    };
    GitHubAPI.prototype.createCommit = function(message, treeSha, parentSha) {
      var data = {
        'message': message,
        'author': {
          'name': this.option.name,
          'email': this.option.email,
          'date': this.toISOFormat(new Date(), this.option.tz)
        },
        'parents': [parentSha],
        'tree': treeSha
      }    
      return this.post('/git/commits', data);
    };
    GitHubAPI.prototype.updateReference = function(branchName, commitSha) {
      return this.patch('/git/refs/heads/' + branchName, { 'sha': commitSha });
    };
    GitHubAPI.prototype.getTree = function(treeSha) {
      return this.get('/git/trees/' + treeSha);
    };
    GitHubAPI.prototype.createTree = function(data) {
      return this.post('/git/trees', data);
    };
    return GitHubAPI;
  })();
  
  return exports.GitHubAPI = GitHubAPI;
})(this);

function makeTodayDiary() {  
  var prop = PropertiesService.getScriptProperties().getProperties();
  const username = prop.GITHUB_USERNAME;
  const repo = prop.GITHUB_REPO;
  const baseUrl = 'https://api.github.com/repos/' + username + '/' + repo
  const date = new Date();
  
  var option = { name: prop.NAME, email: prop.EMAIL };
  var github = new this.GitHubAPI(prop.GITHUB_USERNAME, prop.GITHUB_REPO, prop.GITHUB_TOKEN, option);
  
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
  var result = github.updateReference(prop.GITHUB_BRANCH, commit['sha'], baseUrl, prop);
  Logger.log(result);
}