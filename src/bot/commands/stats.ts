import type { BotContext } from '../context';
import { channelQueries } from '../../database/queries/channels';
import { messageQueries } from '../../database/queries/messages';
import { digestQueries } from '../../database/queries/digests';
import { postQueries } from '../../database/queries/posts';
import { ideaQueries } from '../../database/queries/ideas';

export async function statsCommand(ctx: BotContext): Promise<void> {
  const channels = channelQueries.count();
  const messages = messageQueries.countTotal();
  const digests = digestQueries.count();
  const published = postQueries.countByStatus('published');
  const pending = postQueries.countByStatus('pending');
  const scheduled = postQueries.countByStatus('scheduled');
  const todayPosts = postQueries.countToday();
  const activeIdeas = ideaQueries.countActive();

  await ctx.reply(
    `<b>Numera Content — статистика</b>\n\n` +
    `Источники: ${channels}\n` +
    `Собрано из каналов: ${messages}\n` +
    `Сводок рынка: ${digests}\n\n` +
    `Опубликовано в @Numeramining: ${published}\n` +
    `На проверке: ${pending}\n` +
    `Запланировано: ${scheduled}\n` +
    `Сегодня опубликовано: ${todayPosts}\n\n` +
    `Идей в очереди: ${activeIdeas}`,
    { parse_mode: 'HTML' }
  );
}
