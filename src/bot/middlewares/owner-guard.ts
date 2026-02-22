import { NextFunction } from 'grammy';
import { config } from '../../config';
import type { BotContext } from '../context';

export async function ownerGuard(ctx: BotContext, next: NextFunction): Promise<void> {
  if (ctx.from?.id !== config.OWNER_ID) {
    await ctx.reply('Доступ запрещён.');
    return;
  }
  await next();
}
