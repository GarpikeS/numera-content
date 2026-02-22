import type { BotContext } from '../context';
import { channelQueries } from '../../database/queries/channels';
import { getChannelListKeyboard } from '../keyboards/channels';
import { config } from '../../config';

export async function channelsCommand(ctx: BotContext): Promise<void> {
  const text = ctx.message?.text || '';
  const args = text.replace(/^\/channels\s*/, '').trim();

  if (args.startsWith('add ')) {
    return handleAdd(ctx, args.slice(4).trim());
  }
  if (args.startsWith('del ')) {
    return handleDel(ctx, args.slice(4).trim());
  }

  return handleList(ctx);
}

async function handleList(ctx: BotContext): Promise<void> {
  const channels = channelQueries.getAll();
  if (channels.length === 0) {
    await ctx.reply(
      'Нет каналов.\n\n' +
      'Добавить: /channels add @username Название'
    );
    return;
  }

  await ctx.reply('Мониторимые каналы:', {
    reply_markup: getChannelListKeyboard(channels),
  });
}

async function handleAdd(ctx: BotContext, input: string): Promise<void> {
  // Expected: @username Title or username Title
  const match = input.match(/^@?(\w+)\s*(.*)?$/);
  if (!match) {
    await ctx.reply('Формат: /channels add @username Название');
    return;
  }

  const username = match[1];
  const title = match[2]?.trim() || username;
  const rsshubRoute = `${config.RSSHUB_BASE_URL}/telegram/channel/${username}`;

  try {
    const channel = channelQueries.create(username, title, rsshubRoute);
    await ctx.reply(`Канал добавлен: ${channel.title} (@${channel.username})`);
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      await ctx.reply('Канал уже существует.');
    } else {
      throw err;
    }
  }
}

async function handleDel(ctx: BotContext, input: string): Promise<void> {
  const id = parseInt(input, 10);
  if (isNaN(id)) {
    await ctx.reply('Формат: /channels del <id>');
    return;
  }

  const deleted = channelQueries.delete(id);
  if (deleted) {
    await ctx.reply(`Канал #${id} удалён.`);
  } else {
    await ctx.reply('Канал не найден.');
  }
}
