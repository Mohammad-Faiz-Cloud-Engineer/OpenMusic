import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ChartCard } from '../../src/components/ChartCard';
import type { Chart } from '../../src/api/jiosaavn';

const chart: Chart = {
  id: 'c1',
  title: 'Top Hits',
  description: 'Daily chart',
  thumbnail: null,
};

describe('ChartCard', () => {
  it('renders chart metadata and calls onPress', () => {
    const onPress = jest.fn();
    render(<ChartCard chart={chart} onPress={onPress} />);

    expect(screen.getByText('Top Hits')).toBeTruthy();
    expect(screen.getByText('Daily chart')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Top Hits'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('omits an empty description', () => {
    render(<ChartCard chart={{ ...chart, description: '' }} onPress={jest.fn()} />);
    expect(screen.queryByText('Daily chart')).toBeNull();
  });
});
