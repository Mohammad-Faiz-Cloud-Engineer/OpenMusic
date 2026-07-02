import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { QueryErrorView } from '../../src/components/QueryErrorView';
import '../../src/i18n';

describe('QueryErrorView', () => {
  it('shows default error message', () => {
    render(<QueryErrorView />);
    expect(screen.getByText('Failed to load content')).toBeTruthy();
  });

  it('shows custom message', () => {
    render(<QueryErrorView message="Playlist unavailable" />);
    expect(screen.getByText('Playlist unavailable')).toBeTruthy();
  });

  it('calls onRetry when retry is pressed', () => {
    const onRetry = jest.fn();
    render(<QueryErrorView onRetry={onRetry} />);
    fireEvent.press(screen.getByLabelText('Retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
