type GlobalWithErrorUtils = typeof globalThis & {
  ErrorUtils?: {
    getGlobalHandler: jest.Mock;
    setGlobalHandler: jest.Mock;
  };
};

describe('monitoring', () => {
  const originalErrorUtils = (global as GlobalWithErrorUtils).ErrorUtils;

  afterEach(() => {
    jest.resetModules();
    jest.dontMock('../../src/config/env');
    jest.dontMock('@sentry/react-native');
    jest.restoreAllMocks();
    (global as GlobalWithErrorUtils).ErrorUtils = originalErrorUtils;
  });

  it('logs captured errors in development when Sentry is disabled', () => {
    jest.doMock('../../src/config/env', () => ({ SENTRY_DSN: '' }));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { captureException } =
      require('../../src/services/monitoring') as typeof import('../../src/services/monitoring');
    const error = new Error('boom');

    captureException(error, { area: 'test' });

    expect(errorSpy).toHaveBeenCalledWith('[monitoring]', error, { area: 'test' });
  });

  it('initializes Sentry and wraps the React Native global error handler once', () => {
    const sentryInit = jest.fn();
    const sentryCapture = jest.fn();
    jest.doMock('@sentry/react-native', () => ({
      init: sentryInit,
      captureException: sentryCapture,
    }));
    jest.doMock('../../src/config/env', () => ({ SENTRY_DSN: 'https://dsn.example/1' }));

    let installedHandler: ((error: Error, isFatal?: boolean) => void) | undefined;
    const defaultHandler = jest.fn();
    const errorUtils = {
      getGlobalHandler: jest.fn(() => defaultHandler),
      setGlobalHandler: jest.fn((handler) => {
        installedHandler = handler;
      }),
    };
    (global as GlobalWithErrorUtils).ErrorUtils = errorUtils;

    const { initMonitoring } =
      require('../../src/services/monitoring') as typeof import('../../src/services/monitoring');

    initMonitoring();
    initMonitoring();

    expect(sentryInit).toHaveBeenCalledTimes(1);
    expect(sentryInit).toHaveBeenCalledWith({
      dsn: 'https://dsn.example/1',
      tracesSampleRate: 0.2,
    });
    expect(errorUtils.setGlobalHandler).toHaveBeenCalledTimes(1);

    const error = new Error('fatal');
    installedHandler?.(error, true);

    expect(sentryCapture).toHaveBeenCalledWith(error, { extra: { isFatal: 'true' } });
    expect(defaultHandler).toHaveBeenCalledWith(error, true);
  });
});
