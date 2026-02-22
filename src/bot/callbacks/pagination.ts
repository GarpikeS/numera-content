import type { BotContext } from '../context';

// Placeholder for future pagination support
export async function paginationCallback(ctx: BotContext): Promise<void> {
  await ctx.answerCallbackQuery({ text: 'Пагинация' });
}
