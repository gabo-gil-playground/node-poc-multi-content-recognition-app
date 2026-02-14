import dotenv from 'dotenv';

import { logger } from '../logger/logger';

dotenv.config({ path: '../.env' });

/**
 * Centralized environment configuration for the backend.
 * This module ensures that required variables are validated in a single place.
 */
export interface AppConfig {
  readonly aiVisionApiKey: string;
  readonly aiVisionProviderUrl: string;
  readonly backendHost: string;
  readonly backendPort: number;
}

const parsePort = (rawPort: string | undefined, fallback: number): number => {
  const parsed = rawPort ? Number(rawPort) : fallback;
  if (Number.isNaN(parsed) || parsed <= 0) {
    logger.warn('Invalid BACKEND_PORT value, falling back to default', { rawPort });
    return fallback;
  }
  return parsed;
};

export const appConfig: AppConfig = {
  aiVisionApiKey: process.env.AI_VISION_API_KEY ?? '',
  aiVisionProviderUrl: process.env.AI_VISION_PROVIDER_URL ?? '',
  backendHost: process.env.BACKEND_HOST ?? '0.0.0.0',
  backendPort: parsePort(process.env.BACKEND_PORT, 4000)
};

if (!appConfig.aiVisionApiKey) {
  logger.warn('AI_VISION_API_KEY is not defined. Image recognition requests will fail until it is provided.');
}

if (!appConfig.aiVisionProviderUrl) {
  logger.warn('AI_VISION_PROVIDER_URL is not defined. Image recognition requests will fail until it is provided.');
}

