/**
 * Simple application logger to keep log statements consistent and human readable.
 * This wrapper is intentionally minimal to follow KISS while still allowing
 * future replacement by a more sophisticated logger without touching call sites.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: LogLevel[] = ['debug', 'info', 'warn', 'error'];

const currentLevel: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) && LOG_LEVELS.includes(process.env.LOG_LEVEL as LogLevel)
    ? (process.env.LOG_LEVEL as LogLevel)
    : 'info';

const shouldLog = (level: LogLevel): boolean => {
  return LOG_LEVELS.indexOf(level) >= LOG_LEVELS.indexOf(currentLevel);
};

const formatMessage = (level: LogLevel, message: string, context?: Record<string, unknown>): string => {
  const timestamp = new Date().toISOString();
  const base = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  if (!context || Object.keys(context).length === 0) {
    return base;
  }
  return `${base} | context=${JSON.stringify(context)}`;
};

export const logger = {
  debug(message: string, context?: Record<string, unknown>): void {
    if (shouldLog('debug')) {
      // eslint-disable-next-line no-console
      console.debug(formatMessage('debug', message, context));
    }
  },
  info(message: string, context?: Record<string, unknown>): void {
    if (shouldLog('info')) {
      // eslint-disable-next-line no-console
      console.info(formatMessage('info', message, context));
    }
  },
  warn(message: string, context?: Record<string, unknown>): void {
    if (shouldLog('warn')) {
      // eslint-disable-next-line no-console
      console.warn(formatMessage('warn', message, context));
    }
  },
  error(message: string, context?: Record<string, unknown>): void {
    if (shouldLog('error')) {
      // eslint-disable-next-line no-console
      console.error(formatMessage('error', message, context));
    }
  }
};

