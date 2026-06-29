import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { QueryErrorView } from '../../src/components/QueryErrorView';
import '../../src/i18n';

describe('QueryErrorView', () => {
  it('shows default error message', async () => {
    await render(<QueryErrorView />);
    expect(screen.getByText('Failed to load content')).toBeTruthy();
  });

  it('shows custom message', async () => {
    await render(<QueryErrorView message="Playlist unavailable" />);
    expect(screen.getByText('Playlist unavailable')).toBeTruthy();
  });

  it('calls onRetry when retry is pressed', async () => {
    const onRetry = jest.fn();
    await render(<QueryErrorView onRetry={onRetry} />);
    fireEvent.press(screen.getByLabelText('Retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
