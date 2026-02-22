import type { BotContext } from '../context';
import { postQueries } from '../../database/queries/posts';
import { getReviewKeyboard, formatSlotLabel } from '../keyboards/review';
import { truncate } from '../../utils/truncate';

export async function pendingCommand(ctx: BotContext): Promise<void> {
  const posts = postQueries.getPending();

  if (posts.length === 0) {
    await ctx.reply('Нет постов на проверке.');
    return;
  }

  await ctx.reply(`На проверке: ${posts.length}`);

  for (const post of posts) {
    const slot = postQueries.findNextFreeSlot();
    const label = formatSlotLabel(slot);
    try {
      await ctx.reply(truncate(post.content), {
        parse_mode: 'HTML',
        reply_markup: getReviewKeyboard(post.id, label),
      });
    } catch {
      await ctx.reply(truncate(post.content), {
        reply_markup: getReviewKeyboard(post.id, label),
      });
    }
  }
}
