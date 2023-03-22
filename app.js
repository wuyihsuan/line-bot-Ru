//環境設定讓開發者可以在自己擅長的環境驗測程式
require('dotenv').config();

// import 開發工具SDK / Module
const express = require('express');
const line = require('@line/bot-sdk');
const { Configuration, OpenAIApi } = require("openai");

// 設定line sdk的環境變數
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

// create LINE SDK client
const client = new line.Client(config);

// create Express app
// about Express itself: https://expressjs.com/
const app = express();

// register a webhook handler with middleware
// about the middleware, please refer to doc
app.post('/callback', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// 設定openai api的key
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

// 建立openai  物件
const openai = new OpenAIApi(configuration);

// 訊息(event)處理
async function handleEvent(event) {
  
  //如果訊息類席不是message或是非文字，回值null不進行回應
  if (event.type !== 'message' || event.message.type !== 'text') {
    // ignore non-text-message event
    return Promise.resolve(null);
  }
  
  // 宣告使用openai的module來回答，此為chatgpt 3.0
  //const completion = await openai.createCompletion({
  //  model: "text-davinci-003",
  //  prompt: event.message.text ,
  //  max_tokens: 1000,
  //});
  // 建立chatgpt 3.0回傳訊息的格式echo
  //const echo = { type: 'text', text: completion.data.choices[0].text.trim() };
  
  // 宣告使用openai的module來回答，此為chatgpt 3.5
  const { data } = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: 'user',
        content: '之後的交談中，你叫做AI，2023/3/2出生，請盡量使用繁體中文來回答．'
      },
      {
        role: 'user',
        content: event.message.text,
      }
    ],
    max_tokens: 1000,
  });

  // 建立chatgpt 3.0回傳訊息的格式echo
  const [choices] = data.choices;
  const echo = { type: 'text', text: choices.message.content.trim() || '抱歉，我沒有話可說了。' };

  // 回傳訊息，use reply API
  return client.replyMessage(event.replyToken, echo);
}

// 應用程式的監聽port: listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});