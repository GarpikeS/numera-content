import OpenAI from 'openai';
import { config } from '../config';
import { logger } from '../logger';

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: config.OPENROUTER_API_KEY,
});

export const llmService = {
  async chat(systemPrompt: string, userPrompt: string): Promise<string | null> {
    try {
      const response = await client.chat.completions.create({
        model: config.LLM_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        logger.warn('Empty LLM response');
        return null;
      }
      return content.trim();
    } catch (err) {
      logger.error(err, 'LLM request failed');
      return null;
    }
  },
};
