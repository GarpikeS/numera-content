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
    `<b>Статистика</b>\n\n` +
    `Каналы: ${channels}\n` +
    `Собрано сообщений: ${messages}\n` +
    `Дайджестов: ${digests}\n` +
    `Опубликовано: ${published}\n` +
    `На модерации: ${pending}\n` +
    `Запланировано: ${scheduled}\n` +
    `Сегодня: ${todayPosts}\n` +
    `Активных идей: ${activeIdeas}`,
    { parse_mode: 'HTML' }
  );
}
