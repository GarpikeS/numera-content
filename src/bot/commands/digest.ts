import type { BotContext } from '../context';
import { digestGenerator } from '../../services/digest-generator';
import { logger } from '../../logger';
import { truncate } from '../../utils/truncate';

export async function digestCommand(ctx: BotContext): Promise<void> {
  await ctx.reply('Собираю сводку рынка из крипто-каналов...');

  try {
    const digest = await digestGenerator.generate();
    if (!digest) {
      await ctx.reply('Нет новых сообщений из каналов. Сканирование идёт каждые 2 часа.');
      return;
    }

    await ctx.reply(
      `<b>Сводка рынка</b> (${digest.message_count} источников)\n\n${truncate(digest.summary)}`,
      { parse_mode: 'HTML' }
    );
  } catch (err) {
    logger.error(err, 'Digest command failed');
    await ctx.reply('Ошибка формирования дайджеста.');
  }
}
