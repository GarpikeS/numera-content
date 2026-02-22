import { Bot, session } from 'grammy';
import { config } from '../config';
import { BotContext, initialSession } from './context';
import { ownerGuard } from './middlewares/owner-guard';
import { inputStateHandler } from './middlewares/input-state';
import { startCommand } from './commands/start';
import { channelsCommand } from './commands/channels';
import { digestCommand } from './commands/digest';
import { generateCommand } from './commands/generate';
import { pendingCommand } from './commands/pending';
import { ideasCommand } from './commands/ideas';
import { statsCommand } from './commands/stats';
import { settingsCommand } from './commands/settings';
import { reviewCallback } from './callbacks/review';
import { channelActionsCallback } from './callbacks/channel-actions';
import { ideaActionsCallback } from './callbacks/idea-actions';

export function createBot(): Bot<BotContext> {
  const bot = new Bot<BotContext>(config.BOT_TOKEN);

  // Session
  bot.use(session({ initial: initialSession }));

  // Owner guard
  bot.use(ownerGuard);

  // Input state handler (for edit/idea text capture)
  bot.use(inputStateHandler);

  // Commands
  bot.command('start', startCommand);
  bot.command('channels', channelsCommand);
  bot.command('digest', digestCommand);
  bot.command('generate', generateCommand);
  bot.command('pending', pendingCommand);
  bot.command('ideas', ideasCommand);
  bot.command('stats', statsCommand);
  bot.command('settings', settingsCommand);

  // Reply keyboard text handlers
  bot.hears('Дайджест', digestCommand);
  bot.hears('Генерация', generateCommand);
  bot.hears('Идеи', ideasCommand);
  bot.hears('Модерация', pendingCommand);
  bot.hears('Стат', statsCommand);
  bot.hears('Каналы', channelsCommand);

  // Callback queries
  bot.callbackQuery(/^review:/, reviewCallback);
  bot.callbackQuery(/^schedule:/, reviewCallback);
  bot.callbackQuery(/^ch:/, channelActionsCallback);
  bot.callbackQuery(/^idea:/, ideaActionsCallback);

  return bot;
}
