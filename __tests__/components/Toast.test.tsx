import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Toast } from '../../src/components/Toast';
import { useToastStore } from '../../src/store/toastStore';

describe('Toast', () => {
  beforeEach(() => {
    useToastStore.setState({ message: '', visible: false });
  });

  it('renders the current toast message', () => {
    useToastStore.setState({ message: 'Saved', visible: true });

    render(<Toast />);

    expect(screen.getByText('Saved')).toBeTruthy();
  });
});
