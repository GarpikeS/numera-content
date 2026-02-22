import cron from 'node-cron';
import { Api, RawApi } from 'grammy';
import { config } from '../config';
import { channelMonitor } from './channel-monitor';
import { digestGenerator } from './digest-generator';
import { postGenerator } from './post-generator';
import { publishService } from './publish-service';
import { postQueries } from '../database/queries/posts';
import { logger } from '../logger';
import { truncate } from '../utils/truncate';
import { getReviewKeyboard, formatSlotLabel } from '../bot/keyboards/review';

const tasks: cron.ScheduledTask[] = [];
let api: Api<RawApi> | null = null;

// Publish slots in MSK hours
const PUBLISH_SLOTS = [9, 13, 18];

async function notifyOwner(text: string, postId?: number): Promise<void> {
  if (!api) return;
  try {
    const slotLabel = postId ? formatSlotLabel(postQueries.findNextFreeSlot()) : undefined;
    await api.sendMessage(config.OWNER_ID, text, {
      ...(postId ? { reply_markup: getReviewKeyboard(postId, slotLabel) } : {}),
    });
  } catch (err) {
    logger.error(err, 'Failed to notify owner');
  }
}

/**
 * Check how many posts published today vs how many slots passed.
 * If 2+ slots missed — ping owner.
 */
async function checkPublishPace(): Promise<void> {
  const nowMsk = new Date(Date.now() + 3 * 60 * 60 * 1000);
  const currentHour = nowMsk.getUTCHours();

  const slotsPassed = PUBLISH_SLOTS.filter(h => currentHour >= h).length;
  if (slotsPassed < 2) return; // Too early to judge

  const published = postQueries.countToday();
  const missed = slotsPassed - published;

  if (missed >= 2) {
    const pending = postQueries.getPending();
    const pendingCount = pending.length;

    let msg = `На сегодня пропущено ${missed} из ${slotsPassed} слотов публикации (опубликовано: ${published}).`;
    if (pendingCount > 0) {
      msg += `\n\nЕсть ${pendingCount} постов на проверке — одобри или запланируй.`;
    } else {
      msg += `\n\nНет постов на проверке. Нажми «Новый пост» чтобы сгенерировать.`;
    }

    await notifyOwner(msg, pending[0]?.id);
    logger.info({ missed, published, slotsPassed }, 'Publish pace ping sent');
  }
}

export const scheduler = {
  init(botApi: Api<RawApi>): void {
    api = botApi;
  },

  start(): void {
    // Channel scanning
    tasks.push(
      cron.schedule(config.SCAN_CRON, async () => {
        logger.info('Cron: scanning channels');
        try {
          const result = await channelMonitor.scanAll();
          logger.info(result, 'Cron: scan complete');
        } catch (err) {
          logger.error(err, 'Cron: scan failed');
        }
      })
    );

    // Digest generation
    tasks.push(
      cron.schedule(config.DIGEST_CRON, async () => {
        logger.info('Cron: generating digest');
        try {
          const digest = await digestGenerator.generate();
          if (digest) {
            logger.info({ digestId: digest.id }, 'Cron: digest generated');
            await notifyOwner(`Сводка рынка (${digest.message_count} источников):\n\n${truncate(digest.summary, 3500)}`);
          }
        } catch (err) {
          logger.error(err, 'Cron: digest failed');
        }
      })
    );

    // Post auto-generation: 30 min before each slot (08:30, 12:30, 17:30 MSK = 05:30, 09:30, 14:30 UTC)
    tasks.push(
      cron.schedule('30 5,9,14 * * *', async () => {
        logger.info('Cron: auto-generating post for next slot');
        try {
          const post = await postGenerator.generate();
          if (post) {
            logger.info({ postId: post.id }, 'Cron: post generated');
            await notifyOwner(`Новый пост готов к проверке:\n\n${truncate(post.content, 3500)}`, post.id);
          }
        } catch (err) {
          logger.error(err, 'Cron: post generation failed');
        }
      })
    );

    // Publish scheduled posts
    tasks.push(
      cron.schedule(config.PUBLISH_CHECK_CRON, async () => {
        try {
          const count = await publishService.publishScheduled();
          if (count > 0) {
            logger.info({ count }, 'Cron: scheduled posts published');
          }
        } catch (err) {
          logger.error(err, 'Cron: publish check failed');
        }
      })
    );

    // Publish pace pings — check after 2nd and 3rd slots (13:10 and 18:10 MSK = 10:10 and 15:10 UTC)
    tasks.push(
      cron.schedule('10 10,15 * * *', async () => {
        try {
          await checkPublishPace();
        } catch (err) {
          logger.error(err, 'Cron: pace check failed');
        }
      })
    );

    logger.info('Scheduler started');
  },

  stop(): void {
    for (const task of tasks) {
      task.stop();
    }
    tasks.length = 0;
    logger.info('Scheduler stopped');
  },
};
