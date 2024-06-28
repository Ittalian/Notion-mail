function getTask() {
  var day = new Date();
  day.setDate(day.getDate() + 4);
  const dueDay = Utilities.formatDate(day, 'Asia/Tokyo', 'yyyy-MM-dd');

  const ENDPOINT_PERSONAL_DEVELOP = PropertiesService.getScriptProperties().getProperty('ENDPOINT_PERSONAL_DEVELOP');
  const ENDPOINT_MINECRAFT = PropertiesService.getScriptProperties().getProperty('ENDPOINT_MINECRAFT');
  const ENDPOINT_FREECODECAMP = PropertiesService.getScriptProperties().getProperty('ENDPOINT_FREECODECAMP');
  const ENDPOINT_GRADUATION = PropertiesService.getScriptProperties().getProperty('ENDPOINT_GRADUATION');
  const ENDPOINT_UNIVERSITY = PropertiesService.getScriptProperties().getProperty('ENDPOINT_UNIVERSITY');
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
              "before": dueDay
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
  let mailText = '\n期限が近付いているタスクがあります。\n';
  var totalCharacter = 0;
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
        totalCharacter += taskText.length;

        if (totalCharacter > 1000) {
          mailTextList.push(mailText);
          totalCharacter = 0;
          mailText = taskText;
        } else {
          mailText += taskText;
        }
        mailTextChanged = true;
      }
    }
  }
  if (!mailTextChanged) {
    mailTextList.push('期限が使づいているタスクはありません。');
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

  for (let message of messageList) {
    const options =
    {
      "method": "post",
      "payload": "message=" + message,
      "headers": { "Authorization": "Bearer " + token }
    };

    UrlFetchApp.fetch(lineNotifyApi, options);
  }
}
