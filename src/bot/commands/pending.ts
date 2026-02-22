import type { BotContext } from '../context';
import { postQueries } from '../../database/queries/posts';
import { getReviewKeyboard } from '../keyboards/review';
import { truncate } from '../../utils/truncate';

export async function pendingCommand(ctx: BotContext): Promise<void> {
  const posts = postQueries.getPending();

  if (posts.length === 0) {
    await ctx.reply('Нет постов на проверке.');
    return;
  }

  await ctx.reply(`На проверке: ${posts.length}`);

  for (const post of posts) {
    try {
      await ctx.reply(truncate(post.content), {
        parse_mode: 'HTML',
        reply_markup: getReviewKeyboard(post.id),
      });
    } catch {
      // HTML parse failed — send as plain text
      await ctx.reply(truncate(post.content), {
        reply_markup: getReviewKeyboard(post.id),
      });
    }
  }
}
