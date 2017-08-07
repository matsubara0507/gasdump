/**
* Create an GitHub API Client 
* @param {string} userid GitHub User ID of target 
* @param {string} repo GitHub repository name of target 
* @param {string} token youre GitHub OAuth token (ref: https://developer.github.com/v3/oauth/) 
* @param {Object} option your name, your email, timezone that be used when e.g. commit   
* @return {GitHub} return an GitHub API Client 
*/
function create(userid, repo, token, option) {
  return new GitHubAPI(userid, repo, token, option);
}

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
    GitHubAPI.prototype.createPullRequest = function(title, head, base, body, maintainer_can_modify) {
      var data = {
        'title': title,
        'head': head,
        'base': base,
        'body': body == undefined ? "" : body,
        'maintainer_can_modify': maintainer_can_modify == undefined ? false : maintainer_can_modify
      };
      return this.post('/pulls', data);
    };
    
    return GitHubAPI;
  })();
  
  return exports.GitHubAPI = GitHubAPI;
})(this);
