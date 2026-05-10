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
import { formatSlotLabel } from '../bot/keyboards/review';

const tasks: cron.ScheduledTask[] = [];
let api: Api<RawApi> | null = null;

// Publish slots in MSK hours
const PUBLISH_SLOTS = [10];

function toSqliteDatetime(date: Date): string {
  return date.toISOString().replace('T', ' ').replace('Z', '').slice(0, 19);
}

async function notifyOwner(text: string): Promise<void> {
  if (!api) return;
  try {
    await api.sendMessage(config.OWNER_ID, text);
  } catch (err) {
    logger.error(err, 'Failed to notify owner');
  }
}

/**
 * Check how many posts published today vs how many slots passed.
 * If the daily slot is missed — ping owner.
 */
async function checkPublishPace(): Promise<void> {
  const nowMsk = new Date(Date.now() + 3 * 60 * 60 * 1000);
  const currentHour = nowMsk.getUTCHours();

  const slotsPassed = PUBLISH_SLOTS.filter(h => currentHour >= h).length;
  if (slotsPassed < 1) return; // Too early to judge

  const published = postQueries.countToday();
  const missed = slotsPassed - published;

  if (missed >= 1) {
    const pending = postQueries.getPending();
    const pendingCount = pending.length;

    let msg = `Автопостинг отстал: сегодня пропущено ${missed} из ${slotsPassed} слотов публикации (опубликовано: ${published}).`;
    if (pendingCount > 0) {
      msg += `\n\nЕсть ${pendingCount} постов в pending. Автопостинг работает без утверждения, проверь генерацию/планирование.`;
    } else {
      msg += `\n\nНет pending-постов. Проверь генерацию и publish-check.`;
    }

    await notifyOwner(msg);
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

    // Post auto-generation: 30 min before the daily slot (09:30 MSK = 06:30 UTC)
    tasks.push(
      cron.schedule(config.POST_GEN_CRON, async () => {
        logger.info('Cron: auto-generating post for daily slot');
        try {
          const post = await postGenerator.generate();
          if (post) {
            const slot = postQueries.findNextFreeSlot();
            const label = formatSlotLabel(slot);
            postQueries.schedule(post.id, toSqliteDatetime(slot));
            logger.info({ postId: post.id, slot: slot.toISOString(), label }, 'Cron: post generated and scheduled');
            await notifyOwner(`Автопост запланирован на ${label} МСК без утверждения:\n\n${truncate(post.content, 3500)}`);
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

    // Publish pace ping — check after the daily slot (10:10 MSK = 07:10 UTC)
    tasks.push(
      cron.schedule('10 7 * * *', async () => {
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
