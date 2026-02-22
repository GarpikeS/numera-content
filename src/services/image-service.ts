import { config } from '../config';
import { logger } from '../logger';

interface KandinskyRunResponse {
  uuid: string;
  status: string;
}

interface KandinskyStatusResponse {
  uuid: string;
  status: string;
  images?: string[];
  censored?: boolean;
}

export const imageService = {
  async generate(prompt: string): Promise<Buffer | null> {
    if (!config.KANDINSKY_API_KEY || !config.KANDINSKY_SECRET_KEY) {
      logger.warn('Kandinsky API keys not configured');
      return null;
    }

    try {
      // Step 1: Get model ID
      const modelsRes = await fetch('https://api-key.fusionbrain.ai/key/api/v1/models', {
        headers: {
          'X-Key': `Key ${config.KANDINSKY_API_KEY}`,
          'X-Secret': `Secret ${config.KANDINSKY_SECRET_KEY}`,
        },
      });
      const models = await modelsRes.json() as Array<{ id: number }>;
      const modelId = models[0]?.id;
      if (!modelId) {
        logger.error('No Kandinsky model found');
        return null;
      }

      // Step 2: Run generation
      const formData = new FormData();
      formData.append('model_id', String(modelId));
      formData.append('params', JSON.stringify({
        type: 'GENERATE',
        numImages: 1,
        width: 1024,
        height: 1024,
        generateParams: { query: prompt },
      }));

      const runRes = await fetch('https://api-key.fusionbrain.ai/key/api/v1/text2image/run', {
        method: 'POST',
        headers: {
          'X-Key': `Key ${config.KANDINSKY_API_KEY}`,
          'X-Secret': `Secret ${config.KANDINSKY_SECRET_KEY}`,
        },
        body: formData,
      });
      const runData = await runRes.json() as KandinskyRunResponse;

      // Step 3: Poll for result
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 5000));

        const statusRes = await fetch(
          `https://api-key.fusionbrain.ai/key/api/v1/text2image/status/${runData.uuid}`,
          {
            headers: {
              'X-Key': `Key ${config.KANDINSKY_API_KEY}`,
              'X-Secret': `Secret ${config.KANDINSKY_SECRET_KEY}`,
            },
          }
        );
        const statusData = await statusRes.json() as KandinskyStatusResponse;

        if (statusData.status === 'DONE' && statusData.images?.[0]) {
          return Buffer.from(statusData.images[0], 'base64');
        }
        if (statusData.status === 'FAIL') {
          logger.error({ censored: statusData.censored }, 'Kandinsky generation failed');
          return null;
        }
      }

      logger.error('Kandinsky generation timeout');
      return null;
    } catch (err) {
      logger.error(err, 'Image generation error');
      return null;
    }
  },
};
