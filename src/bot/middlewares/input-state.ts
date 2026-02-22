import { NextFunction } from 'grammy';
import type { BotContext } from '../context';
import { postQueries } from '../../database/queries/posts';
import { ideaQueries } from '../../database/queries/ideas';
import { logger } from '../../logger';

export async function inputStateHandler(ctx: BotContext, next: NextFunction): Promise<void> {
  const state = ctx.session.inputState;
  const text = ctx.message?.text;

  if (!text || !state.mode) {
    await next();
    return;
  }

  // Skip commands
  if (text.startsWith('/')) {
    ctx.session.inputState = { mode: null };
    await next();
    return;
  }

  if (state.mode === 'edit_post' && state.postId) {
    try {
      postQueries.updateContent(state.postId, text);
      ctx.session.inputState = { mode: null };
      await ctx.reply(`Пост #${state.postId} обновлён. Отправляю на модерацию.`);
      // Re-show review keyboard
      const post = postQueries.getById(state.postId);
      if (post) {
        const { getReviewKeyboard, formatSlotLabel } = await import('../keyboards/review');
        const { postQueries: pq } = await import('../../database/queries/posts');
        const slot = pq.findNextFreeSlot();
        const label = formatSlotLabel(slot);
        await ctx.reply(post.content, {
          parse_mode: 'HTML',
          reply_markup: getReviewKeyboard(post.id, label),
        });
      }
    } catch (err) {
      logger.error(err, 'Failed to update post');
      await ctx.reply('Ошибка обновления поста.');
    }
    return;
  }

  if (state.mode === 'add_idea') {
    try {
      ideaQueries.create(text);
      ctx.session.inputState = { mode: null };
      await ctx.reply(`Идея сохранена!`);
    } catch (err) {
      logger.error(err, 'Failed to save idea');
      await ctx.reply('Ошибка сохранения идеи.');
    }
    return;
  }

  await next();
}
