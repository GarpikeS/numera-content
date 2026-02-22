import type { BotContext } from '../context';
import { getMainMenu } from '../keyboards/main-menu';

export async function startCommand(ctx: BotContext): Promise<void> {
  await ctx.reply(
    'Numera Content — контент-менеджер канала @Numeramining\n\n' +
    'Мониторю крипто-каналы, собираю сводку рынка и генерирую посты для продвижения Numera — экосистемы для майнеров (каталог ASIC, калькулятор ROI, маркетплейс б/у, аналитика).\n\n' +
    'Кнопки ниже — основные действия:',
    { reply_markup: getMainMenu() }
  );
}
