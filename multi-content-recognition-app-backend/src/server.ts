import { appConfig } from './config/env';
import { createApp } from './app';
import { logger } from './logger/logger';

const app = createApp();

app.listen(appConfig.backendPort, appConfig.backendHost, () => {
  logger.info('Backend server started successfully.', {
    host: appConfig.backendHost,
    port: appConfig.backendPort
  });
});

