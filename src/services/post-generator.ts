import { digestQueries } from '../database/queries/digests';
import { ideaQueries } from '../database/queries/ideas';
import { postQueries } from '../database/queries/posts';
import { llmService } from './llm-service';
import { logger } from '../logger';
import type { Post, SourceType } from '../types';

const SYSTEM_PROMPT = `Ты — контент-менеджер Telegram-канала @Numeramining.

О проекте Numera (numera24.ru):
- Полная экосистема для майнеров криптовалют
- Каталог ASIC-оборудования (24+ моделей: Antminer S21, Whatsminer M60S, Avalon и др.)
- Интерактивный калькулятор ROI — расчёт окупаемости с учётом курса, сложности, стоимости электричества
- Маркетплейс б/у оборудования (P2P с системой эскроу, комиссия 2%)
- Профили поставщиков с рейтингами и отзывами
- AI-ассистент для подбора оборудования
- Мониторинг устройств, интеграция с пулами
- Подписки: Free (базовый доступ) и Extended (аналитика, приоритет)
- Аудитория: домашние майнеры, коммерческие фермы, инвесторы, поставщики

Твоя задача — писать посты для канала @Numeramining.

Правила контента:
- Пост информативный и вовлекающий, без воды
- HTML-разметка Telegram: <b>, <i>, <a href="...">, <code> — НЕ Markdown
- Уместные эмодзи (не перебарщивай)
- Длина: 300-900 символов
- Заканчивай призывом к действию (переход на numera24.ru, калькулятор, каталог) или вопросом к аудитории
- Тон: профессиональный, дружелюбный, уверенный — как старший товарищ-майнер
- Не рекламируй Numera в лоб — давай полезность, а ссылку на платформу органично
- Если пост про оборудование — упомяни каталог. Если про окупаемость — калькулятор. Если про покупку б/у — маркетплейс
- НЕ выдумывай цифры курсов и хешрейтов — используй только данные из дайджеста`;

export const postGenerator = {
  async generate(topic?: string): Promise<Post | null> {
    const digest = digestQueries.getLatest();
    const ideas = ideaQueries.getActive();

    let sourceType: SourceType = 'manual';
    let digestId: number | undefined;
    let userPrompt = '';

    if (topic) {
      userPrompt = `Напиши пост на тему: ${topic}`;
      sourceType = 'manual';
    } else if (digest && ideas.length > 0) {
      userPrompt = `На основе дайджеста и идей напиши пост.\n\nДайджест:\n${digest.summary}\n\nИдеи:\n${ideas.map(i => `- ${i.text}`).join('\n')}`;
      sourceType = 'mixed';
      digestId = digest.id;
    } else if (digest) {
      userPrompt = `На основе дайджеста напиши пост:\n\n${digest.summary}`;
      sourceType = 'digest';
      digestId = digest.id;
    } else if (ideas.length > 0) {
      userPrompt = `На основе идей напиши пост:\n\n${ideas.map(i => `- ${i.text}`).join('\n')}`;
      sourceType = 'idea';
    } else {
      userPrompt = 'Напиши полезный пост для майнеров. Темы на выбор: как считать окупаемость ASIC, на что обратить внимание при покупке б/у оборудования, сравнение пулов, или как выбрать между воздушным и гидро-охлаждением. Ссылайся на инструменты Numera где уместно.';
    }

    const content = await llmService.chat(SYSTEM_PROMPT, userPrompt);
    if (!content) return null;

    const post = postQueries.create(content, sourceType, digestId);

    // Mark ideas as used
    if (ideas.length > 0 && (sourceType === 'idea' || sourceType === 'mixed')) {
      for (const idea of ideas) {
        ideaQueries.markUsed(idea.id, post.id);
      }
    }

    logger.info({ postId: post.id, sourceType }, 'Post generated');
    return post;
  },

  async regenerate(postId: number): Promise<Post | null> {
    const old = postQueries.getById(postId);
    if (!old) return null;

    const content = await llmService.chat(
      SYSTEM_PROMPT,
      `Перепиши этот пост другими словами, сохрани смысл:\n\n${old.content}`
    );
    if (!content) return null;

    postQueries.updateContent(postId, content);
    postQueries.updateStatus(postId, 'pending');

    return postQueries.getById(postId) ?? null;
  },
};
