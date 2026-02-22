import type { BotContext } from '../context';
import { ideaQueries } from '../../database/queries/ideas';
import { getIdeasKeyboard } from '../keyboards/ideas';

export async function ideasCommand(ctx: BotContext): Promise<void> {
  const text = ctx.message?.text || '';
  const args = text.replace(/^\/ideas\s*/, '').trim();

  if (args.startsWith('add ')) {
    return handleAdd(ctx, args.slice(4).trim());
  }

  return handleList(ctx);
}

async function handleList(ctx: BotContext): Promise<void> {
  const ideas = ideaQueries.getActive();

  if (ideas.length === 0) {
    await ctx.reply(
      'Нет активных идей.\n\n' +
      'Добавить: /ideas add <текст>\n' +
      'Или нажми кнопку ниже.',
      { reply_markup: getIdeasKeyboard([]) }
    );
    return;
  }

  await ctx.reply(`Активные идеи (${ideas.length}):`, {
    reply_markup: getIdeasKeyboard(ideas),
  });
}

async function handleAdd(ctx: BotContext, text: string): Promise<void> {
  if (!text) {
    await ctx.reply('Формат: /ideas add <текст идеи>');
    return;
  }

  ideaQueries.create(text);
  await ctx.reply('Идея сохранена!');
}
