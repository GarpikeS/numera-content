import type { BotContext } from '../context';
import { getMainMenu } from '../keyboards/main-menu';

export async function startCommand(ctx: BotContext): Promise<void> {
  await ctx.reply(
    'Numera Content Bot\n\n' +
    'Управление контентом для канала Numera.\n' +
    'Используй кнопки ниже или команды.',
    { reply_markup: getMainMenu() }
  );
}
