import type { BotContext } from '../context';
import { channelQueries } from '../../database/queries/channels';
import { getChannelListKeyboard } from '../keyboards/channels';

export async function channelActionsCallback(ctx: BotContext): Promise<void> {
  const data = ctx.callbackQuery?.data;
  if (!data) return;

  const [, action, idStr] = data.split(':');
  const id = parseInt(idStr, 10);

  if (action === 'toggle') {
    const ch = channelQueries.toggle(id);
    if (ch) {
      await ctx.answerCallbackQuery({
        text: ch.is_active ? 'Канал включён' : 'Канал выключен',
      });
    }
  } else if (action === 'del') {
    channelQueries.delete(id);
    await ctx.answerCallbackQuery({ text: 'Канал удалён' });
  }

  // Refresh list
  const channels = channelQueries.getAll();
  if (channels.length === 0) {
    await ctx.editMessageText('Нет каналов.');
  } else {
    await ctx.editMessageReplyMarkup({
      reply_markup: getChannelListKeyboard(channels),
    });
  }
}
