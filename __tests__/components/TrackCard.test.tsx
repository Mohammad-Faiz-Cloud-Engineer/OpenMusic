import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { TrackCard } from '../../src/components/TrackCard';
import type { Track } from '../../src/api/jiosaavn';

const mockTrack: Track = {
  id: 't1',
  title: 'Test Song',
  artist: 'Test Artist',
  album: 'Album',
  duration_seconds: 200,
  thumbnail: null,
  language: 'hindi',
  has_lyrics: false,
  explicit: false,
  stream_url: null,
};

const mockPlayTrack = jest.fn();

jest.mock('../../src/store/playerStore', () => ({
  usePlayerStore: () => ({
    playTrack: mockPlayTrack,
    currentTrack: null,
    isPlaying: false,
  }),
}));

describe('TrackCard', () => {
  beforeEach(() => {
    mockPlayTrack.mockClear();
  });

  it('renders track title and artist', () => {
    render(<TrackCard track={mockTrack} />);
    expect(screen.getByText('Test Song')).toBeTruthy();
    expect(screen.getByText('Test Artist')).toBeTruthy();
  });

  it('plays track on press', () => {
    render(<TrackCard track={mockTrack} />);
    fireEvent.press(screen.getByLabelText('Test Song by Test Artist'));
    expect(mockPlayTrack).toHaveBeenCalledWith(mockTrack, undefined, { index: undefined });
  });

  it('shows explicit badge when track is explicit', () => {
    render(<TrackCard track={{ ...mockTrack, explicit: true }} />);
    expect(screen.getByText('E')).toBeTruthy();
  });
});
