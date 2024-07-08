const PROPERTIES = PropertiesService.getScriptProperties();
const ENDPOINTS = {
  PERSONAL_DEVELOP: PROPERTIES.getProperty('ENDPOINT_PERSONAL_DEVELOP'),
  MINECRAFT: PROPERTIES.getProperty('ENDPOINT_MINECRAFT'),
  FREECODECAMP: PROPERTIES.getProperty('ENDPOINT_FREECODECAMP'),
  GRADUATION: PROPERTIES.getProperty('ENDPOINT_GRADUATION'),
  UNIVERSITY: PROPERTIES.getProperty('ENDPOINT_UNIVERSITY')
};
const HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer ' + PROPERTIES.getProperty('SECRET_KEY'),
  'Notion-Version': '2022-06-28'
};

function getNotionTasks(filter) {
  const options = {
    'method': 'POST',
    'headers': HEADERS,
    'payload': JSON.stringify({ "filter": filter, "sorts": [{ "property": "Due", "direction": "ascending" }] })
  };

  return Object.values(ENDPOINTS).map(endpoint =>
    JSON.parse(UrlFetchApp.fetch(endpoint, options).getContentText())['results']
  ).flat();
}

function formatTasks(tasks) {
  return tasks.map(task => {
    const properties = task['properties'];
    const taskName = properties['Task name']['title'][0]['text']['content'];
    const due = Utilities.formatDate(Utilities.parseDate(properties['Due']['date']['start'], 'GMT', 'yyyy-MM-dd'), 'Asia/Tokyo', 'yyyy年MM月dd日');
    return `\nタスク名: 「${taskName}」\n期限: ${due}\n${task['url']}\n`;
  });
}

function chunkMessages(messages, maxLen = 1000) {
  let chunks = [], chunk = '';
  messages.forEach(msg => {
    if (chunk.length + msg.length > maxLen) {
      chunks.push(chunk);
      chunk = msg;
    } else {
      chunk += msg;
    }
  });
  chunks.push(chunk);
  return chunks;
}

function getTaskMessages() {
  const today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
  const dueDay = Utilities.formatDate(new Date(new Date().setDate(new Date().getDate() + 4)), 'Asia/Tokyo', 'yyyy-MM-dd');

  const tasks = getNotionTasks({
    "and": [
      { "or": [{ "property": "Status", "status": { "equals": "Not started" } }, { "property": "Status", "status": { "equals": "In progress" } }] },
      { "and": [{ "property": "Due", "date": { "before": dueDay } }, { "property": "Due", "date": { "after": today } }] }
    ]
  });

  const messages = tasks.length > 0 ? formatTasks(tasks) : ['期限が近付いているタスクはありません。'];
  return chunkMessages(messages);
}

function getOverdueTaskMessages() {
  const today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');

  const tasks = getNotionTasks({
    "and": [
      { "or": [{ "property": "Status", "status": { "equals": "Not started" } }, { "property": "Status", "status": { "equals": "In progress" } }] },
      { "property": "Due", "date": { "before": today } }
    ]
  });

  const messages = tasks.length > 0 ? formatTasks(tasks) : [];
  return chunkMessages(messages);
}

function sendMail() {
  const to = 'ittalian0329@gmail.com';
  const subject = 'タスクリマインドメール';
  const body = getTaskMessages().join("\n");
  MailApp.sendEmail(to, subject, body);
}

function sendLineMessages(token, messages, prefix) {
  const lineNotifyApi = "https://notify-api.line.me/api/notify";
  let page = 1;
  messages.forEach(message => {
    UrlFetchApp.fetch(lineNotifyApi, {
      "method": "post",
      "payload": "message=" + `${prefix}${page}ページ目\n${message}`,
      "headers": { "Authorization": "Bearer " + token }
    });
    page++;
  });
}

function sendLineNotify() {
  const token = PROPERTIES.getProperty('LINE_NOTIFY_TOKEN');
  const today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy年MM月dd日');

  const overdueMessages = getOverdueTaskMessages();
  if (overdueMessages[0] != '') {
    sendLineMessages(token, overdueMessages, `\n期限が過ぎているタスクがあります。\n\n${today}\n\n`);
  }

  const taskMessages = getTaskMessages();
  if (taskMessages[0] !== "期限が近付いているタスクはありません。") {
    sendLineMessages(token, taskMessages, `\n期限が近付いているタスクがあります。\n\n${today}\n\n`);
  } else {
    sendLineMessages(token, taskMessages, '');
  }
}
