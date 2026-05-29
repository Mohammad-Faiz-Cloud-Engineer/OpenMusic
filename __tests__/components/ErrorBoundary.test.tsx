import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ErrorBoundary } from '../../src/components/ErrorBoundary';
import { captureException } from '../../src/services/monitoring';
import '../../src/i18n';

jest.mock('../../src/services/monitoring', () => ({
  captureException: jest.fn(),
}));

let shouldThrow = false;

const MaybeThrowingChild = () => {
  if (shouldThrow) throw new Error('boom');
  return <Text>Recovered</Text>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    shouldThrow = false;
    jest.mocked(captureException).mockClear();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <Text>Healthy</Text>
      </ErrorBoundary>
    );

    expect(screen.getByText('Healthy')).toBeTruthy();
  });

  it('renders a recoverable child when it is healthy', () => {
    render(
      <ErrorBoundary>
        <MaybeThrowingChild />
      </ErrorBoundary>
    );

    expect(screen.getByText('Recovered')).toBeTruthy();
  });

  it('captures child errors and lets the user retry', () => {
    shouldThrow = true;
    render(
      <ErrorBoundary>
        <MaybeThrowingChild />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(captureException).toHaveBeenCalled();

    shouldThrow = false;
    fireEvent.press(screen.getByLabelText('Try again'));
    expect(screen.queryByText('Something went wrong')).toBeNull();
    expect(screen.getByText('Recovered')).toBeTruthy();
  });
});
