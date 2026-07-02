import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { SectionHeader } from '../../src/components/SectionHeader';
import '../../src/i18n';

describe('SectionHeader', () => {
  it('renders title and subtitle', () => {
    render(<SectionHeader title="Trending" subtitle="Hot tracks" />);
    expect(screen.getByText('Trending')).toBeTruthy();
    expect(screen.getByText('Hot tracks')).toBeTruthy();
  });

  it('calls onSeeAll when pressed', () => {
    const onSeeAll = jest.fn();
    render(<SectionHeader title="Charts" onSeeAll={onSeeAll} />);
    fireEvent.press(screen.getByLabelText('See all'));
    expect(onSeeAll).toHaveBeenCalledTimes(1);
  });
});
