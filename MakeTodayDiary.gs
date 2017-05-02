function makeTodayDiary() {
  var prop = PropertiesService.getScriptProperties().getProperties();
  const username = prop.GITHUB_USERNAME;
  const repo = prop.GITHUB_REPO;
  const baseUrl = 'https://api.github.com/repos/' + username + '/' + repo
  const date = new Date();
  
  var branch = getBranch(prop.GITHUB_BRANCH, baseUrl, prop);
  var pTree = getTree(branch['commit']['commit']['tree']['sha'], baseUrl, prop);
  var blob = createBlob('# ' + Utilities.formatDate(date, 'Asia/Tokyo', "yyyy/MM/dd (EEE)"), baseUrl, prop);

  var data = {
    'tree': pTree['tree'].concat([{
      'path': 'diary/' + Utilities.formatDate(date, 'Asia/Tokyo', "yyyy/MM/dd") + '.md',
      'mode': '100644',
      'type': 'blob',
      'sha': blob['sha']
    }])
  };

  var tree = createTree(data, baseUrl, prop);
  var commit = createCommit('commit!!', tree['sha'], branch['commit']['sha'], baseUrl, prop);
  var result = updateReference(prop.GITHUB_BRANCH, commit['sha'], baseUrl, prop);
  Logger.log(result);
}

function getBranch(branchName, baseUrl, prop) {
  var response = UrlFetchApp.fetch(baseUrl + '/branches/' + branchName, {
    headers: {
      Authorization: 'token ' + prop.GITHUB_TOKEN
    }
  });
  return JSON.parse(response);
}

function getTree(treeSha, baseUrl, prop) {
  var response = UrlFetchApp.fetch(baseUrl + '/git/trees/' + treeSha, {
    headers: {
      Authorization: 'token ' + prop.GITHUB_TOKEN
    }
  });
  return JSON.parse(response);
}

function createBlob(content, baseUrl, prop) {
  var data = { 'content': content, 'encoding': 'utf-8' };
  var response = UrlFetchApp.fetch(baseUrl + '/git/blobs', {
    headers: {
      Authorization: 'token ' + prop.GITHUB_TOKEN
    },
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify(data)
  });
  return JSON.parse(response);
}

function createTree(data, baseUrl, prop) {
  var response = UrlFetchApp.fetch(baseUrl + '/git/trees', {
    headers: {
      Authorization: 'token ' + prop.GITHUB_TOKEN
    },
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify(data)
  });
  return JSON.parse(response);
}

function createCommit(message, tree, parent, baseUrl, prop) {
  var data = {
    'message': message,
    'author': {
      'name': prop.NAME,
      'email': prop.EMAIL,
      'date': dateFormat4Git(new Date())
    },
    'parents': [parent],
    'tree': tree
  }
  var response = UrlFetchApp.fetch(baseUrl + '/git/commits', {
    headers: {
      Authorization: 'token ' + prop.GITHUB_TOKEN
    },
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify(data)
  });
  return JSON.parse(response);
}

function updateReference(branchName, commitSha, baseUrl, prop) {
  var data = {
    'sha': commitSha
  }
  var response = UrlFetchApp.fetch(baseUrl + '/git/refs/heads/' + branchName, {
    headers: {
      Authorization: 'token ' + prop.GITHUB_TOKEN
    },
    method: 'PATCH',
    contentType: 'application/json',
    payload: JSON.stringify(data)
  });
  return JSON.parse(response);  
}

function dateFormat4Git(date) {
  return Utilities.formatDate(date, 'Asia/Tokyo', "yyyy-MM-dd'T'HH:mm:ssXXX");
}