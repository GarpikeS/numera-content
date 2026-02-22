import Parser from 'rss-parser';
import { channelQueries } from '../database/queries/channels';
import { messageQueries } from '../database/queries/messages';
import { logger } from '../logger';

const parser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 'NumeraContentBot/1.0',
  },
});

export const channelMonitor = {
  async scanAll(): Promise<{ scanned: number; newMessages: number }> {
    const channels = channelQueries.getActive();
    let totalNew = 0;

    for (const channel of channels) {
      try {
        const count = await this.scanChannel(channel.id, channel.rsshub_route);
        totalNew += count;
        logger.info({ channel: channel.username, newMessages: count }, 'Channel scanned');
      } catch (err) {
        logger.error({ err, channel: channel.username }, 'Failed to scan channel');
      }
    }

    return { scanned: channels.length, newMessages: totalNew };
  },

  async scanChannel(channelId: number, rsshubUrl: string): Promise<number> {
    const feed = await parser.parseURL(rsshubUrl);
    let newCount = 0;

    for (const item of feed.items) {
      const externalId = item.guid || item.link || item.title || '';
      if (!externalId) continue;

      const content = item.contentSnippet || item.content || item.title || '';
      const pubDate = item.isoDate || item.pubDate || new Date().toISOString();

      const msg = messageQueries.create(channelId, externalId, content, pubDate);
      if (msg) newCount++;
    }

    return newCount;
  },
};
