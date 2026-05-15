import { ErrorUtils } from 'react-native';
import { SENTRY_DSN } from '../config/env';
import { devError } from '../utils/devLog';

let sentryReady = false;

export const initMonitoring = (): void => {
  if (SENTRY_DSN) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Sentry = require('@sentry/react-native') as typeof import('@sentry/react-native');
      Sentry.init({
        dsn: SENTRY_DSN,
        tracesSampleRate: 0.2,
      });
      sentryReady = true;
    } catch (err) {
      devError('[monitoring] Sentry init failed:', err);
    }
  }

  const defaultHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    captureException(error, { isFatal: String(isFatal) });
    defaultHandler?.(error, isFatal);
  });
};

export const captureException = (error: unknown, context?: Record<string, string>): void => {
  if (sentryReady) {
    try {
      const Sentry = require('@sentry/react-native') as typeof import('@sentry/react-native');
      Sentry.captureException(error, { extra: context });
      return;
    } catch {
      // fall through
    }
  }
  if (__DEV__) {
    devError('[monitoring]', error, context);
  }
};
