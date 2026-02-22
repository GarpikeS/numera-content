import { Api, RawApi } from 'grammy';
import { postQueries } from '../database/queries/posts';
import { config } from '../config';
import { logger } from '../logger';
import { truncate } from '../utils/truncate';

let api: Api<RawApi> | null = null;

export const publishService = {
  init(botApi: Api<RawApi>): void {
    api = botApi;
  },

  async publish(postId: number): Promise<boolean> {
    if (!api) {
      logger.error('Bot API not initialized in publish service');
      return false;
    }

    const post = postQueries.getById(postId);
    if (!post) {
      logger.error({ postId }, 'Post not found for publishing');
      return false;
    }

    try {
      const result = await api.sendMessage(
        config.TG_CHANNEL_ID,
        truncate(post.content),
        { parse_mode: 'HTML' }
      );

      postQueries.markPublished(postId, result.message_id);
      logger.info({ postId, tgMessageId: result.message_id }, 'Post published');
      return true;
    } catch (err) {
      logger.error(err, 'Failed to publish post');
      return false;
    }
  },

  async publishScheduled(): Promise<number> {
    const posts = postQueries.getScheduled();
    let published = 0;

    for (const post of posts) {
      const ok = await this.publish(post.id);
      if (ok) published++;
    }

    if (published > 0) {
      logger.info({ published }, 'Scheduled posts published');
    }
    return published;
  },
};
