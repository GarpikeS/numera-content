import type { BotContext } from '../context';
import { ideaQueries } from '../../database/queries/ideas';
import { getIdeasKeyboard } from '../keyboards/ideas';

export async function ideaActionsCallback(ctx: BotContext): Promise<void> {
  const data = ctx.callbackQuery?.data;
  if (!data) return;

  const [, action, idStr] = data.split(':');
  const id = parseInt(idStr, 10);

  if (action === 'add') {
    ctx.session.inputState = { mode: 'add_idea' };
    await ctx.answerCallbackQuery();
    await ctx.reply('Отправьте текст идеи:');
    return;
  }

  if (action === 'view') {
    const idea = ideaQueries.getById(id);
    if (idea) {
      await ctx.answerCallbackQuery({ text: idea.text.slice(0, 200) });
    }
    return;
  }

  if (action === 'del') {
    ideaQueries.delete(id);
    await ctx.answerCallbackQuery({ text: 'Идея удалена' });

    const ideas = ideaQueries.getActive();
    if (ideas.length === 0) {
      await ctx.editMessageText('Нет активных идей.', {
        reply_markup: getIdeasKeyboard([]),
      });
    } else {
      await ctx.editMessageReplyMarkup({
        reply_markup: getIdeasKeyboard(ideas),
      });
    }
  }
}
