'use strict';

const express = require('express');
const line = require('@line/bot-sdk');
const request = require('request');
const fs = require('fs');


const teachBotUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSennF4iGYu834NrY2oYtnsht0k68y9_ixKQe6RV0LSS5cjvRQ/viewform?usp=pp_url';
let maxSubStringLength = 5;
let teachTag = 10; // 1/n 發送 teachBotUrl 連結 
let rptb = '(눈_눈)讓我更好吧~~\n' + teachBotUrl; 
var myMap = new Map();
var reply = '';
let rt = ''; // replyToken


/*
	@Reply map
  myMap.set("立偉", ['立偉老師好帥!!', '立偉老師最棒了~~']);
  @reply = array[Math.floor(Math.random() * array.length)];
*/
// 4
myMap.set("高師燕巢", ['我也很好奇', '蠻夷?!', '╮(﹀_﹀”)╭我在地圖上找不到']);
// 3
myMap.set("怎麼了", ['你累了...']);
myMap.set("美乃滋", ['╮(﹀_﹀”)╭嗐~~駿騰又再問垃圾問題了']);
myMap.set("高師大", ['都是好學生...', 'd(ŐдŐ๑)我爸在那裏!!!']);
// 2
myMap.set("立偉", ['立偉老師好帥!!', '(｡◕ˇ∀ˇ◕）立偉老師最棒了~~', '\(≥▽≤)/立偉萬歲~']);
myMap.set("笑話", ['陳駿騰', '陳律彥', '๑乛◡乛๑你隊友']);
myMap.set("燕巢", ['╮(﹀_﹀”)╭我在地圖上找不到']);

/*
    @ “研究生命的起源”进行分词。
    @ 正向最大匹配: 研究生 命 的 起源
    研究生命的
    研究生命
    研究生 #第一个词匹配成功
    @ 逆向最大匹配: 研究 生命 的 起源
    生命的起源
    命的起源
    的起源
    起源 #第一个词匹配成功
*/
function reverseMatch(data){
  let result = '';
  let content = '';
  let maxLength = -1;
  let countLength = 0;
  let n = data.length;
  let s = (n-maxSubStringLength > 0)? n-maxSubStringLength : 0;
  while(n != 0){
      let substring = data.substring(s,n)
      content = myMap.get(substring);
      //console.log(content);
      //console.log("s: " + s + " n: " + n);
      if(typeof content !== "undefined"){
          countLength = content.length;
          n = s;
          s = (n-maxSubStringLength > 0)? n-maxSubStringLength : 0;      
          if(countLength > maxLength){
          maxLength = countLength;
          result = substring;
          }
      }else{
          s = (s+1 > n)? n : s+1;
          if(s === n){
              n = (n-1 < 0)? 0 : n-1;
              s = (n-maxSubStringLength > 0)? n-maxSubStringLength : 0;
          }
      } 
  }
  //console.log("result: " + result);
  return result;
}

function replyTeachBot(){
  if(Math.floor(Math.random() * teachTag) === 0){
    return client.replyMessage(rt, {type: 'text', text: rptb});
  }
}

const config = {
  apiKey: fs.readFileSync(`${__dirname}/config/api_key.txt`, 'utf8').trim(),
  channelAccessToken: fs.readFileSync(`${__dirname}/config/channel_access_token.txt`, 'utf8').trim(),
  channelSecret: fs.readFileSync(`${__dirname}/config/channel_secret.txt`, 'utf8').trim(),
  botName: fs.readFileSync(`${__dirname}/config/bot_name.txt`, 'utf8').trim(),
  country: fs.readFileSync(`${__dirname}/config/country.txt`, 'utf8').trim(),
  atextBadProbMax: fs.readFileSync(`${__dirname}/config/atext_bad_prob_max.txt`, 'utf8').trim(),
  atextBadProbMin: fs.readFileSync(`${__dirname}/config/atext_bad_prob_min.txt`, 'utf8').trim(),
  atextLengthMax: fs.readFileSync(`${__dirname}/config/atext_length_max.txt`, 'utf8').trim(),
  atextLengthMin: fs.readFileSync(`${__dirname}/config/atext_length_min.txt`, 'utf8').trim(),
  registDateMax: fs.readFileSync(`${__dirname}/config/regist_date_max.txt`, 'utf8').trim(),
  registDateMin: fs.readFileSync(`${__dirname}/config/regist_date_min.txt`, 'utf8').trim(),
};

const lineConfig = {
  channelAccessToken: config.channelAccessToken,
  channelSecret: config.channelSecret,
};
const client = new line.Client(lineConfig);

const app = express();

app.post('/callback', line.middleware(lineConfig), (req, res) => {
  if (req.body.destination) {
    console.log(`Destination User ID: ${req.body.destination}`);
  }

  if (!Array.isArray(req.body.events)) {
    return res.status(500).end();
  }

  Promise.all(req.body.events.map(handleEvent))
    .then(() => res.end())
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

function handleEvent(event) {
  if (event.replyToken && event.replyToken.match(/^(.)\1*$/)) {
    return console.log(`Test hook received: ${JSON.stringify(event.message)}`);
  }

  if (event.type === 'message') {
    const message = event.message;
    if (message.type === 'text') {
      rt = event.replyToken;
      var array = myMap.get(reverseMatch(message.text));
      // call tha Simsimi API
      if(array === undefined){
        handleText(message, event.replyToken);
        return replyTeachBot();
      }
      // myMap has reply
      reply = array[Math.floor(Math.random() * array.length)];
      //sleep(1000);
      client.replyMessage(event.replyToken, {type: 'text', text: reply});
      return replyTeachBot();

    } else {
      console.log(`Unsupported type: ${JSON.stringify(message.type)}`);
      return Promise.resolve(null);
    }
  } else {
    console.log(`Unsupported type: ${JSON.stringify(event.type)}`);
    return Promise.resolve(null);
  }
}

function handleText(message, replyToken) {
  const options = {
    method: 'POST',
    url: 'https://wsapi.simsimi.com/190410/talk/',
    headers: {
      'x-api-key': config.apiKey,
      'Content-Type': 'application/json',
    },
    body: buildBody(message.text),
    json: true
  };

  request(options, (err, res, data) => {
    if (err) {
      return replyText(replyToken, '(錯誤在試一次)');
    } else {
      return replyText(replyToken, data);
    }
  })
}

function buildBody(utext) {
  const body = {
    utext: utext,
    lang: 'ch',
  };

  if (config.botName) body['bot_name'] = config.botName.split(',').map(s => s.trim()).filter((item, pos, self) => self.indexOf(item) === pos);
  if (config.country) body['country'] = config.country.split(',').map(s => s.trim());
  if (config.atextBadProbMax) body['atext_bad_prob_max'] = Number(config.atextBadProbMax);
  if (config.atextBadProbMin) body['atext_bad_prob_min'] = Number(config.atextBadProbMin);
  if (config.atextLengthMax) body['atext_length_max'] = Number(config.atextLengthMax);
  if (config.atextLengthMin) body['atext_length_min'] = Number(config.atextLengthMin);
  if (config.registDateMax) body['regist_date_max'] = Number(config.registDateMax);
  if (config.registDateMin) body['regist_date_min'] = Number(config.registDateMin);

  return body;
}

function replyText(token, text) {
	if(text.status == 200){
		reply = text.atext;
	}else if(text.status == 227 || text.status == 228 || text.status == 429 || text.status == 500){
		reply = '我不會回答這句話。\n來教教我吧~\n' + teachBotUrl;
	}else {
		reply = '今天就聊到這裡吧~~';
	}	
  return client.replyMessage(token, {type: 'text', text: reply});
  //return client.replyMessage(token, {type: 'text', text: text.status + " " + text.statusMessage + " " + text.atext + " (Test)"});
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});