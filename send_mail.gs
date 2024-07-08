const ENDPOINT_PERSONAL_DEVELOP = PropertiesService.getScriptProperties().getProperty('ENDPOINT_PERSONAL_DEVELOP');
const ENDPOINT_MINECRAFT = PropertiesService.getScriptProperties().getProperty('ENDPOINT_MINECRAFT');
const ENDPOINT_FREECODECAMP = PropertiesService.getScriptProperties().getProperty('ENDPOINT_FREECODECAMP');
const ENDPOINT_GRADUATION = PropertiesService.getScriptProperties().getProperty('ENDPOINT_GRADUATION');
const ENDPOINT_UNIVERSITY = PropertiesService.getScriptProperties().getProperty('ENDPOINT_UNIVERSITY');

function getTask() {
  var day = new Date();
  const today = Utilities.formatDate(day, 'Asia/Tokyo', 'yyyy-MM-dd');
  day.setDate(day.getDate() + 4);
  const dueDay = Utilities.formatDate(day, 'Asia/Tokyo', 'yyyy-MM-dd');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + PropertiesService.getScriptProperties().getProperty('SECRET_KEY'),
    'Notion-Version': '2022-06-28',
  };
  // リクエストオプション
  const options = {
    'method': 'POST',
    'headers': headers,
    'payload': JSON.stringify({
      "filter": {
        "and": [
          {
            "or": [
              {
                "property": "Status",
                "status": {
                  "equals": "Not started"
                }
              },
              {
                "property": "Status",
                "status": {
                  "equals": "In progress"
                }
              }
            ]
          },
          {
            "and": [
              {
                "property": "Due",
                "date": {
                  "before": dueDay
                }
              },
              {
                "property": "Due",
                "date": {
                  "after": today
                }
              }
            ]
          }
        ]
      },
      "sorts": [
        {
          "property": "Due",
          "direction": "ascending"
        }
      ]
    })
  };

  const res_personal_develop = JSON.parse(UrlFetchApp.fetch(ENDPOINT_PERSONAL_DEVELOP, options).getContentText());
  const res_minecraft = JSON.parse(UrlFetchApp.fetch(ENDPOINT_MINECRAFT, options).getContentText());
  const res_graduation = JSON.parse(UrlFetchApp.fetch(ENDPOINT_GRADUATION, options).getContentText());
  const res_freecodecamp = JSON.parse(UrlFetchApp.fetch(ENDPOINT_FREECODECAMP, options).getContentText());
  const res_university = JSON.parse(UrlFetchApp.fetch(ENDPOINT_UNIVERSITY, options).getContentText());

  const responses = [res_personal_develop, res_minecraft, res_graduation, res_freecodecamp, res_university];

  let mailTextChanged = false;
  let mailText = '';
  var mailTextList = [];
  for (let res of responses) {
    if (res['results'].length != 0) {
      for (let i = 0; i < res['results'].length; i++) {
        const properties = res['results'][i]['properties'];
        const taskName = properties['Task name']['title'][0]['text']['content'];
        const due = properties['Due']['date']['start'];
        const interpritedDue = Utilities.parseDate(due, 'GMT', 'yyyy-MM-dd');
        const formattedDue = Utilities.formatDate(interpritedDue, 'Asia/Tokyo', 'yyyy年MM月dd日');
        const url = res['results'][i]['url'];
        const taskText = '\nタスク名: ' + '「' + taskName + '」' + '\n' + '期限: ' + formattedDue + '\n' + url + '\n';

        if (mailText.length + taskText.length > 1000) {
          mailTextList.push(mailText);
          mailText = taskText;
        } else {
          mailText += taskText;
        }
        mailTextChanged = true;
      }
    }
  }
  mailTextList.push(mailText);
  if (!mailTextChanged) {
    mailTextList.push('期限が使づいているタスクはありません。');
  }

  return mailTextList;
}

function getOverTask() {
  var day = new Date();
  const today = Utilities.formatDate(day, 'Asia/Tokyo', 'yyyy-MM-dd');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + PropertiesService.getScriptProperties().getProperty('SECRET_KEY'),
    'Notion-Version': '2022-06-28',
  };
  // リクエストオプション
  const options = {
    'method': 'POST',
    'headers': headers,
    'payload': JSON.stringify({
      "filter": {
        "and": [
          {
            "or": [
              {
                "property": "Status",
                "status": {
                  "equals": "Not started"
                }
              },
              {
                "property": "Status",
                "status": {
                  "equals": "In progress"
                }
              }
            ]
          },
          {
            "property": "Due",
            "date": {
              "before": today
            }
          }
        ]
      },
      "sorts": [
        {
          "property": "Due",
          "direction": "ascending"
        }
      ]
    })
  };

  const res_personal_develop = JSON.parse(UrlFetchApp.fetch(ENDPOINT_PERSONAL_DEVELOP, options).getContentText());
  const res_minecraft = JSON.parse(UrlFetchApp.fetch(ENDPOINT_MINECRAFT, options).getContentText());
  const res_graduation = JSON.parse(UrlFetchApp.fetch(ENDPOINT_GRADUATION, options).getContentText());
  const res_freecodecamp = JSON.parse(UrlFetchApp.fetch(ENDPOINT_FREECODECAMP, options).getContentText());
  const res_university = JSON.parse(UrlFetchApp.fetch(ENDPOINT_UNIVERSITY, options).getContentText());

  const responses = [res_personal_develop, res_minecraft, res_graduation, res_freecodecamp, res_university];

  let mailTextChanged = false;
  let mailText = '';
  var mailTextList = [];
  for (let res of responses) {
    if (res['results'].length != 0) {
      for (let i = 0; i < res['results'].length; i++) {
        const properties = res['results'][i]['properties'];
        const taskName = properties['Task name']['title'][0]['text']['content'];
        const due = properties['Due']['date']['start'];
        const interpritedDue = Utilities.parseDate(due, 'GMT', 'yyyy-MM-dd');
        const formattedDue = Utilities.formatDate(interpritedDue, 'Asia/Tokyo', 'yyyy年MM月dd日');
        const url = res['results'][i]['url'];
        const taskText = '\nタスク名: ' + '「' + taskName + '」' + '\n' + '期限: ' + formattedDue + '\n' + url + '\n';

        if (mailText.length + taskText.length > 1000) {
          mailTextList.push(mailText);
          mailText = taskText;
        } else {
          mailText += taskText;
        }
        mailTextChanged = true;
      }
    }
  }
  mailTextList.push(mailText);
  if (!mailTextChanged) {
    mailTextList.push('期限が過ぎているタスクはありません。');
  }

  return mailTextList;
}

function calledByCron() {
  const to = 'ittalian0329@gmail.com';
  const subject = 'タスクリマインドメール';
  const body = getTask().join("\n");

  MailApp.sendEmail(to, subject, body);
}

function sendMessageByLineNotify() {
  const token = PropertiesService.getScriptProperties().getProperty('LINE_NOTIFY_TOKEN');
  const lineNotifyApi = "https://notify-api.line.me/api/notify";
  const messageList = getTask();
  const overMessageList = getOverTask();
  const today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy年MM月dd日');
  let page = 1;

  if (overMessageList[0] !== "期限が過ぎているタスクはありません。") {
    let firstMessage = `\n期限が過ぎているタスクがあります。\n\n${today}\n\n${page}ページ目\n`;

    for (const message of overMessageList) {
      createLineMessage(token, lineNotifyApi, firstMessage + message);
      page += 1;
      firstMessage = `\n\n${page}ページ目\n`;
    }
  } else {
    createLineMessage(token, lineNotifyApi, messageList[0]);
  }

  if (messageList[0] !== "期限が近付いているタスクはありません。") {
    let firstMessage = `\n期限が近付いているタスクがあります。\n\n${today}\n\n${page}ページ目\n`;

    for (const message of messageList) {
      createLineMessage(token, lineNotifyApi, firstMessage + message);
      page += 1;
      firstMessage = `\n\n${page}ページ目\n`;
    }
  } else {
    createLineMessage(token, lineNotifyApi, messageList[0]);
  }

  page = 1;
}

function createLineMessage(token, endpoint, message) {
  const options = {
    "method": "post",
    "payload": "message=" + message,
    "headers": { "Authorization": "Bearer " + token }
  };
  UrlFetchApp.fetch(endpoint, options);
}
