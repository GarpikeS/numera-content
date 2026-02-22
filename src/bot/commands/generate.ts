import type { BotContext } from '../context';
import { postGenerator } from '../../services/post-generator';
import { getReviewKeyboard } from '../keyboards/review';
import { logger } from '../../logger';
import { truncate } from '../../utils/truncate';

export async function generateCommand(ctx: BotContext): Promise<void> {
  const text = ctx.message?.text || '';
  const topic = text.replace(/^\/generate\s*/, '').trim() || undefined;

  await ctx.reply('Генерирую пост для @Numeramining...');

  try {
    const post = await postGenerator.generate(topic);
    if (!post) {
      await ctx.reply('Не удалось сгенерировать пост. Попробуй позже.');
      return;
    }

    // Try HTML first, fallback to plain text
    try {
      await ctx.reply(truncate(post.content), {
        parse_mode: 'HTML',
        reply_markup: getReviewKeyboard(post.id),
      });
    } catch {
      await ctx.reply(truncate(post.content), {
        reply_markup: getReviewKeyboard(post.id),
      });
    }
  } catch (err) {
    logger.error(err, 'Generate command failed');
    await ctx.reply('Ошибка генерации поста.');
  }
}
