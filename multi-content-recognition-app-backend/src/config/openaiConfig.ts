import OpenAI from 'openai';

import { appConfig } from './env';
import { logger } from '../logger/logger';

/**
 * OpenAI client configuration wrapper.
 * This module acts as a proxy layer so we can swap AI providers in the future
 * without impacting the rest of the codebase.
 */

export const OPENAI_VISION_MODEL = 'gpt-4o-mini';

if (!appConfig.aiVisionApiKey || !appConfig.aiVisionProviderUrl) {
  logger.warn('OpenAI configuration is incomplete. Please verify AI_VISION_API_KEY and AI_VISION_PROVIDER_URL.');
}

export const openAiClient = new OpenAI({
  apiKey: appConfig.aiVisionApiKey,
  baseURL: appConfig.aiVisionProviderUrl
});

