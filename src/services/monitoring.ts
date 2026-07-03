import { SENTRY_DSN } from '../config/env';
import { devError } from '../utils/devLog';

// ErrorUtils is a RN runtime global, not a named export from 'react-native'.
// Access it via the global object so it degrades gracefully if unavailable.
const RNErrorUtils: typeof ErrorUtils | undefined =
  typeof global !== 'undefined'
    ? (global as unknown as { ErrorUtils?: typeof ErrorUtils }).ErrorUtils
    : undefined;

const sanitizeUrl = (url: string): string => {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}${u.pathname}`;
  } catch {
    return url.length > 100 ? `[redacted]` : url;
  }
};

const sanitizeMessage = (msg: string | undefined): string | undefined => {
  if (!msg) return msg;
  return msg.length > 500 ? msg.slice(0, 500) + '... [truncated]' : msg;
};

const isHighCardinality = (key: string, val: string): boolean => {
  if (key === 'componentStack' || key === 'isFatal') return false;
  return val.length > 200;
};

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
        beforeSend: (event) => {
          if (event.request?.url) {
            event.request.url = sanitizeUrl(event.request.url);
          }
          if (event.exception?.values) {
            event.exception.values = event.exception.values.map((v) => ({
              ...v,
              value: sanitizeMessage(v.value),
            }));
          }
          if (event.extra) {
            const sanitized: Record<string, string> = {};
            for (const [key, val] of Object.entries(event.extra)) {
              if (typeof val === 'string' && isHighCardinality(key, val)) {
                sanitized[key] = `[redacted] (${val.length} chars)`;
              } else {
                sanitized[key] = String(val);
              }
            }
            event.extra = sanitized;
          }
          return event;
        },
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
