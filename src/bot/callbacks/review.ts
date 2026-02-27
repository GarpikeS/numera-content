import type { BotContext } from '../context';
import { postQueries } from '../../database/queries/posts';
import { publishService } from '../../services/publish-service';
import { postGenerator } from '../../services/post-generator';
import { getReviewKeyboard, formatSlotLabel } from '../keyboards/review';
import { logger } from '../../logger';
import { truncate } from '../../utils/truncate';

export async function reviewCallback(ctx: BotContext): Promise<void> {
  const data = ctx.callbackQuery?.data;
  if (!data) return;

  const parts = data.split(':');
  const action = parts[1];
  const postId = parseInt(parts[2], 10);

  const post = postQueries.getById(postId);
  if (!post) {
    await ctx.answerCallbackQuery({ text: 'Пост не найден' });
    return;
  }

  switch (action) {
    case 'approve':
      return handleApprove(ctx, postId);
    case 'publish':
      return handlePublish(ctx, postId);
    case 'edit':
      return handleEdit(ctx, postId);
    case 'regen':
      return handleRegen(ctx, postId);
    case 'reject':
      return handleReject(ctx, postId);
    default:
      await ctx.answerCallbackQuery({ text: 'Неизвестное действие' });
  }
}

function toSqliteDatetime(date: Date): string {
  return date.toISOString().replace('T', ' ').replace('Z', '').slice(0, 19);
}

async function handleApprove(ctx: BotContext, postId: number): Promise<void> {
  try {
    const slot = postQueries.findNextFreeSlot();
    const label = formatSlotLabel(slot);
    postQueries.schedule(postId, toSqliteDatetime(slot));

    await ctx.editMessageText(`Запланировано на ${label} МСК`);
    await ctx.answerCallbackQuery({ text: `Запланировано: ${label}` });
    logger.info({ postId, slot: slot.toISOString(), label }, 'Post auto-scheduled');
  } catch (err) {
    logger.error(err, 'Auto-schedule failed');
    await ctx.answerCallbackQuery({ text: 'Ошибка планирования' });
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
      const slot = postQueries.findNextFreeSlot();
      const label = formatSlotLabel(slot);
      try {
        await ctx.editMessageText(truncate(post.content), {
          parse_mode: 'HTML',
          reply_markup: getReviewKeyboard(post.id, label),
        });
      } catch {
        await ctx.editMessageText(truncate(post.content), {
          reply_markup: getReviewKeyboard(post.id, label),
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
