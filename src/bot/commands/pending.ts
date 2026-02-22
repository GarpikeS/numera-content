import type { BotContext } from '../context';
import { postQueries } from '../../database/queries/posts';
import { getReviewKeyboard } from '../keyboards/review';
import { truncate } from '../../utils/truncate';

export async function pendingCommand(ctx: BotContext): Promise<void> {
  const posts = postQueries.getPending();

  if (posts.length === 0) {
    await ctx.reply('Нет постов на модерации.');
    return;
  }

  for (const post of posts) {
    await ctx.reply(
      `<b>Пост #${post.id}</b>\n\n${truncate(post.content)}`,
      {
        parse_mode: 'HTML',
        reply_markup: getReviewKeyboard(post.id),
      }
    );
  }
}
