import { config } from './config';
import { logger } from './logger';
import { getDb, closeDb } from './database/db';
import { createBot } from './bot';
import { publishService } from './services/publish-service';
import { scheduler } from './services/scheduler';

async function main(): Promise<void> {
  logger.info('Starting NumeraContent bot...');

  // Initialize database
  getDb();

  // Create bot
  const bot = createBot();

  // Initialize services with bot API
  publishService.init(bot.api);
  scheduler.init(bot.api);

  // Start scheduler
  scheduler.start();

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down...');
    scheduler.stop();
    await bot.stop();
    closeDb();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Start bot
  await bot.start({
    onStart: (info) => {
      logger.info({ username: info.username }, 'Bot started');
    },
  });
}

main().catch((err) => {
  logger.fatal(err, 'Fatal error');
  process.exit(1);
});
