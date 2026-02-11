import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { imageRecognitionRouter } from './routes/imageRecognitionRoutes';
import { logger } from './logger/logger';

export const createApp = (): express.Express => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: '*'
    })
  );
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api/v1/vision', imageRecognitionRouter);

  // Centralized error handler to return consistent responses.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error('Unhandled error caught by global error handler.', {
      error: err instanceof Error ? err.message : String(err)
    });
    res.status(400).json({
      error: 'Unable to process the provided image. Please verify the file and try again.'
    });
  });

  return app;
};

