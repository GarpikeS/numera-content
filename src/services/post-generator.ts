import { digestQueries } from '../database/queries/digests';
import { ideaQueries } from '../database/queries/ideas';
import { postQueries } from '../database/queries/posts';
import { llmService } from './llm-service';
import { logger } from '../logger';
import type { Post, SourceType } from '../types';

const SYSTEM_PROMPT = `Ты — SMM-менеджер крипто-проекта Numera (майнинг-экосистема). Генерируй посты для Telegram-канала.

Правила:
- Пост должен быть информативным и вовлекающим
- Используй HTML-разметку Telegram: <b>, <i>, <a>, <code>
- Добавляй релевантные эмодзи
- Длина: 300-800 символов
- Заканчивай призывом к действию или вопросом
- Не используй Markdown, только HTML
- Тон: профессиональный, но дружелюбный
- Всегда упоминай Numera где уместно`;

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
      userPrompt = 'Напиши пост о текущих трендах в крипто-индустрии и майнинге, упомяни Numera.';
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
