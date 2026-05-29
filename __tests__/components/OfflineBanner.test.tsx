import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { OfflineBanner } from '../../src/components/OfflineBanner';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';
import '../../src/i18n';

jest.mock('../../src/hooks/useNetworkStatus', () => ({
  useNetworkStatus: jest.fn(),
}));

describe('OfflineBanner', () => {
  it('renders nothing when online', () => {
    jest.mocked(useNetworkStatus).mockReturnValue({ isOnline: true });

    const { toJSON } = render(<OfflineBanner />);
    expect(toJSON()).toBeNull();
  });

  it('renders the offline warning when offline', () => {
    jest.mocked(useNetworkStatus).mockReturnValue({ isOnline: false });

    render(<OfflineBanner />);

    expect(screen.getByText("You're offline")).toBeTruthy();
    expect(screen.getByText('Connect to the internet to browse and stream music.')).toBeTruthy();
  });
});
