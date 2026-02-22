import { messageQueries } from '../database/queries/messages';
import { digestQueries } from '../database/queries/digests';
import { channelQueries } from '../database/queries/channels';
import { llmService } from './llm-service';
import { logger } from '../logger';
import type { Digest } from '../types';

const SYSTEM_PROMPT = `Ты — аналитик крипто-рынка, работающий на проект Numera (numera24.ru).

Numera — экосистема для майнеров: каталог ASIC-оборудования (Antminer, Whatsminer, Avalon), интерактивный калькулятор ROI, маркетплейс б/у оборудования с эскроу, профили поставщиков, мониторинг устройств, аналитика.

Твоя задача — создать сводку рынка из собранных сообщений крипто-каналов. Сводка нужна для внутреннего использования (для генерации постов в канал @Numeramining).

Правила:
- Выдели то, что важно для майнеров: курс BTC/ETH, сложность сети, хешрейт, новое оборудование, регуляция в РФ
- Отметь тренды, влияющие на доходность майнинга
- Укажи настроение рынка (бычий/медвежий/боковик)
- Если есть новости про ASIC, пулы, электроэнергию, хостинг — выдели отдельно
- Формат: структурированный текст с разделами
- Язык: русский
- Длина: 500-1500 символов`;

export const digestGenerator = {
  async generate(): Promise<Digest | null> {
    const messages = messageQueries.getUnused();
    if (messages.length === 0) {
      logger.info('No unused messages for digest');
      return null;
    }

    // Build channel name map
    const channelMap = new Map<number, string>();
    for (const ch of channelQueries.getAll()) {
      channelMap.set(ch.id, ch.title || ch.username);
    }

    // Prepare messages text
    const messagesText = messages
      .slice(0, 100) // Limit to avoid token overflow
      .map((m, i) => {
        const channel = channelMap.get(m.channel_id) || 'Unknown';
        return `[${channel}] ${m.content.slice(0, 500)}`;
      })
      .join('\n---\n');

    const summary = await llmService.chat(
      SYSTEM_PROMPT,
      `Вот ${messages.length} сообщений из крипто-каналов:\n\n${messagesText}`
    );

    if (!summary) {
      logger.error('Failed to generate digest summary');
      return null;
    }

    const dates = messages.map(m => m.pub_date).sort();
    const periodStart = dates[0];
    const periodEnd = dates[dates.length - 1];

    const digest = digestQueries.create(summary, messages.length, periodStart, periodEnd);

    // Mark messages as used
    const messageIds = messages.map(m => m.id);
    messageQueries.markUsedInDigest(messageIds, digest.id);

    logger.info({ digestId: digest.id, messageCount: messages.length }, 'Digest generated');
    return digest;
  },
};
