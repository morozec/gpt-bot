const { Telegraf, Markup } = require('telegraf');
const { Pool, Client } = require('pg')
const { OpenAI } = require('openai')

const bot = new Telegraf(process.env.BOT_TOKEN);
let client = undefined;

const openai = new OpenAI({
   apiKey: process.env.OPENAI_API_KEY,
});

bot.start((ctx) => {
    client
        .query(`INSERT INTO ACCOUNT (name) VALUES ('${ctx.message.from.username}') ON CONFLICT DO NOTHING`)
        .then(() =>
            ctx.reply(
                `Привет, ${ctx.message.from.username}! Я умею отвечать на вопросы с помощью GPT-моделей
С полным списком моих функций можно ознакомиться по команде /help`
            ));
});

bot.help((ctx) => ctx.reply(`Вот что я умею:\n
    /TODO
`))

async function gpt(userMessage) {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: userMessage }],
      model: "gpt-3.5-turbo",
    });
  
    console.log(completion.choices[0]);
    return completion.choices[0].message.content;
}

bot.on('text', async (ctx) => {
    try {
        const gptResult = await gpt(ctx.message.text);
        ctx.reply(`Hello, ${ctx.message.from.username}, ${gptResult}`);
    } catch(ex) {
        ctx.reply(`Ошибка GPT`);
    }
})

module.exports.handler = async function (event, context) {
    const proxyId = "akf41ande0e8e9288hta";// Идентификатор подключения
    let proxyEndpoint = "akf41ande0e8e9288hta.postgresql-proxy.serverless.yandexcloud.net:6432"; // Точка входа

    const user = "root"; // Пользователь БД
    let conString = "postgres://" + user + ":" + context.token.access_token + "@" + proxyEndpoint + "/" + proxyId + "?ssl=true";

    client = new Client(conString);
    client.connect();

    const message = JSON.parse(event.body);
    await bot.handleUpdate(message);
    return {
        statusCode: 200,
        body: '',
    };
};
