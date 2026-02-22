import type { BotContext } from '../context';
import { postQueries } from '../../database/queries/posts';
import { publishService } from '../../services/publish-service';
import { postGenerator } from '../../services/post-generator';
import { getReviewKeyboard, getScheduleKeyboard } from '../keyboards/review';
import { logger } from '../../logger';
import { truncate } from '../../utils/truncate';

export async function reviewCallback(ctx: BotContext): Promise<void> {
  const data = ctx.callbackQuery?.data;
  if (!data) return;

  const parts = data.split(':');
  // review:action:postId or schedule:hour:postId
  if (parts[0] === 'schedule') {
    return handleSchedule(ctx, parts);
  }

  const action = parts[1];
  const postId = parseInt(parts[2], 10);

  const post = postQueries.getById(postId);
  if (!post) {
    await ctx.answerCallbackQuery({ text: 'Пост не найден' });
    return;
  }

  switch (action) {
    case 'publish':
      return handlePublish(ctx, postId);
    case 'schedule':
      return showSchedule(ctx, postId);
    case 'edit':
      return handleEdit(ctx, postId);
    case 'regen':
      return handleRegen(ctx, postId);
    case 'reject':
      return handleReject(ctx, postId);
    case 'back':
      await ctx.editMessageReplyMarkup({ reply_markup: getReviewKeyboard(postId) });
      await ctx.answerCallbackQuery();
      return;
    default:
      await ctx.answerCallbackQuery({ text: 'Неизвестное действие' });
  }
}

async function handlePublish(ctx: BotContext, postId: number): Promise<void> {
  try {
    const result = await publishService.publish(postId);
    if (result) {
      await ctx.editMessageText('Опубликовано!');
      await ctx.answerCallbackQuery({ text: 'Пост опубликован' });
    } else {
      await ctx.answerCallbackQuery({ text: 'Ошибка публикации' });
    }
  } catch (err) {
    logger.error(err, 'Publish failed');
    await ctx.answerCallbackQuery({ text: 'Ошибка публикации' });
  }
}

async function showSchedule(ctx: BotContext, postId: number): Promise<void> {
  await ctx.editMessageReplyMarkup({ reply_markup: getScheduleKeyboard(postId) });
  await ctx.answerCallbackQuery();
}

async function handleSchedule(ctx: BotContext, parts: string[]): Promise<void> {
  const hour = parseInt(parts[1], 10);
  const postId = parseInt(parts[2], 10);

  // Schedule for today at the given hour (MSK = UTC+3)
  const now = new Date();
  const scheduled = new Date(now);
  scheduled.setUTCHours(hour - 3, 0, 0, 0); // Convert MSK to UTC
  if (scheduled <= now) {
    scheduled.setDate(scheduled.getDate() + 1);
  }

  postQueries.schedule(postId, scheduled.toISOString());
  await ctx.editMessageText(`Запланировано на ${hour}:00 МСК`);
  await ctx.answerCallbackQuery({ text: 'Запланировано' });
}

async function handleEdit(ctx: BotContext, postId: number): Promise<void> {
  ctx.session.inputState = { mode: 'edit_post', postId };
  await ctx.answerCallbackQuery();
  await ctx.reply('Отправьте новый текст поста:');
}

async function handleRegen(ctx: BotContext, postId: number): Promise<void> {
  await ctx.answerCallbackQuery({ text: 'Перегенерация...' });
  try {
    const post = await postGenerator.regenerate(postId);
    if (post) {
      try {
        await ctx.editMessageText(truncate(post.content), {
          parse_mode: 'HTML',
          reply_markup: getReviewKeyboard(post.id),
        });
      } catch {
        await ctx.editMessageText(truncate(post.content), {
          reply_markup: getReviewKeyboard(post.id),
        });
      }
    }
  } catch (err) {
    logger.error(err, 'Regen failed');
    await ctx.reply('Ошибка перегенерации.');
  }
}

async function handleReject(ctx: BotContext, postId: number): Promise<void> {
  postQueries.updateStatus(postId, 'rejected');
  await ctx.editMessageText('Пост отклонён.');
  await ctx.answerCallbackQuery({ text: 'Отклонено' });
}
