import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { SectionHeader } from '../../src/components/SectionHeader';
import '../../src/i18n';

describe('SectionHeader', () => {
  it('renders title and subtitle', async () => {
    await render(<SectionHeader title="Trending" subtitle="Hot tracks" />);
    expect(screen.getByText('Trending')).toBeTruthy();
    expect(screen.getByText('Hot tracks')).toBeTruthy();
  });

  it('calls onSeeAll when pressed', async () => {
    const onSeeAll = jest.fn();
    await render(<SectionHeader title="Charts" onSeeAll={onSeeAll} />);
    fireEvent.press(screen.getByLabelText('See all'));
    expect(onSeeAll).toHaveBeenCalledTimes(1);
  });
});
