import { Telegraf } from 'telegraf';
import schedule from 'node-schedule';
import dotenv from 'dotenv';

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN!;

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN was not!");
}

const bot = new Telegraf(BOT_TOKEN);

const pollQuestion = 'Хто завтра йде на жим на 10?';
const pollOptions = ['+', '-', 'Інший час'];

const userResponses: Record<string, string> = {};

let chatId: number | undefined;

bot.on('message', async (ctx) => {
  if (!chatId) {
    chatId = ctx.chat.id; 
    console.log(`Chat ID saved: ${chatId}`);
  }
});

schedule.scheduleJob('0 18 * * 0,4', async () => {
  if (!chatId) {
    console.error('Chat ID is undefined!');
    return;
  }

  const poll = await bot.telegram.sendPoll(chatId, pollQuestion, pollOptions, {
    is_anonymous: false,
  });

  bot.on('poll_answer', (ctx) => {
    const { user, option_ids } = ctx.update.poll_answer;
    const selectedOption = pollOptions[option_ids[0]];

    if (user && chatId) {
      userResponses[user.id] = selectedOption;
      switch (selectedOption) {
        case '+':
          bot.telegram.sendMessage(chatId, `Фарту @${user.username}`);
          break;
        case '-':
          bot.telegram.sendMessage(chatId, `@${user.username} завтра на измене`);
          break;
        case 'Інший час':
          bot.telegram.sendMessage(chatId, `@${user.username}, на котру годину ти хочеш піти?`);
          break;
      }
    }
  });
});

bot.launch().then(() => console.log('Bot launched!')).catch(() => console.log('Bot launch failed!'));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));