import cron from 'node-cron';
import { config } from '../config';
import { channelMonitor } from './channel-monitor';
import { digestGenerator } from './digest-generator';
import { postGenerator } from './post-generator';
import { publishService } from './publish-service';
import { logger } from '../logger';

const tasks: cron.ScheduledTask[] = [];

export const scheduler = {
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
          }
        } catch (err) {
          logger.error(err, 'Cron: digest failed');
        }
      })
    );

    // Post generation
    tasks.push(
      cron.schedule(config.POST_GEN_CRON, async () => {
        logger.info('Cron: generating post');
        try {
          const post = await postGenerator.generate();
          if (post) {
            logger.info({ postId: post.id }, 'Cron: post generated');
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
