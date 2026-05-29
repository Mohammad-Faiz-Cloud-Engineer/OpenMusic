import React from 'react';
import { render } from '@testing-library/react-native';
import { SkeletonCard } from '../../src/components/LoadingScreen';

describe('SkeletonCard', () => {
  it('renders with custom dimensions', () => {
    const { toJSON, unmount } = render(
      <SkeletonCard width={120} height={64} borderRadius={12} />
    );

    expect(toJSON()).toBeTruthy();
    unmount();
  });
});
