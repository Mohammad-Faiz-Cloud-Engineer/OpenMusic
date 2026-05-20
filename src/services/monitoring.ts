import { SENTRY_DSN } from '../config/env';
import { devError } from '../utils/devLog';

// ErrorUtils is a RN runtime global, not a named export from 'react-native'.
// Access it via the global object so it degrades gracefully if unavailable.
const RNErrorUtils: typeof ErrorUtils | undefined =
  typeof global !== 'undefined'
    ? (global as unknown as { ErrorUtils?: typeof ErrorUtils }).ErrorUtils
    : undefined;

let sentryReady = false;
let monitoringReady = false;

export const initMonitoring = (): void => {
  if (monitoringReady) return;
  monitoringReady = true;

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

  if (RNErrorUtils) {
    const defaultHandler = RNErrorUtils.getGlobalHandler();
    RNErrorUtils.setGlobalHandler((error, isFatal) => {
      captureException(error, { isFatal: String(isFatal) });
      defaultHandler?.(error, isFatal);
    });
  }
};

export const captureException = (error: unknown, context?: Record<string, string>): void => {
  if (sentryReady) {
    try {
      const Sentry = require('@sentry/react-native') as typeof import('@sentry/react-native');
      Sentry.captureException(error, { extra: context });
      return;
    } catch (err) {
      devError('[monitoring] Sentry capture failed:', err);
    }
  }
  if (__DEV__) {
    devError('[monitoring]', error, context);
  }
};
