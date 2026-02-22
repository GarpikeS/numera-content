import type { BotContext } from '../context';
import { config } from '../../config';

export async function settingsCommand(ctx: BotContext): Promise<void> {
  await ctx.reply(
    `<b>Настройки</b>\n\n` +
    `Сканирование: <code>${config.SCAN_CRON}</code>\n` +
    `Дайджест: <code>${config.DIGEST_CRON}</code>\n` +
    `Генерация: <code>${config.POST_GEN_CRON}</code>\n` +
    `Проверка публикации: <code>${config.PUBLISH_CHECK_CRON}</code>\n` +
    `Макс. постов/день: ${config.MAX_POSTS_PER_DAY}\n` +
    `LLM: ${config.LLM_MODEL}\n` +
    `RSSHub: ${config.RSSHUB_BASE_URL}\n\n` +
    `Настройки задаются через .env`,
    { parse_mode: 'HTML' }
  );
}
