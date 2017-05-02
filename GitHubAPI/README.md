# GitHubAPI

[GitHub API](https://developer.github.com/v3/) を叩くための GAS ライブラリ

## Usage

ライブラリの API ID は `MpVhtQfIUrL3OfsqY2BMtnIv0J4XZf0PJ`

## 注意

まだ、自分が必要な分の API しか追加してないです。
下記のように書けば、一応自由に追加できる。

```js
function getBranch(branchName) {
  return this.get('/branches/' + branchName);
}

function createBlob(content) {
  return this.post('/git/blobs', { 'content': content, 'encoding': 'utf-8' });
}
```

(`getBranch` と `createBlob` はあるけど)

## example

適当なファイルを追加するGAS

```js
function makeTodayDiary() {  
  var prop = PropertiesService.getScriptProperties().getProperties();
  const date = new Date();
  
  var option = { name: prop.NAME, email: prop.EMAIL };
  var github = new GitHubAPI.create(prop.GITHUB_USERNAME, prop.GITHUB_REPO, prop.GITHUB_TOKEN, option);
  
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
```
