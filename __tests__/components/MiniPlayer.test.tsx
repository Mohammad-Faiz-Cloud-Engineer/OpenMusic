import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { usePlayerStore } from '../../src/store/playerStore';
import type { Track } from '../../src/api/jiosaavn';
import { MiniPlayer } from '../../src/components/MiniPlayer';
import '../../src/i18n';

const track: Track = {
  id: 't1',
  title: 'Mini Song',
  artist: 'Mini Artist',
  album: 'Album',
  duration_seconds: 180,
  thumbnail: null,
  language: null,
  has_lyrics: false,
  explicit: false,
  stream_url: null,
};

describe('MiniPlayer', () => {
  beforeEach(() => {
    usePlayerStore.setState({
      currentTrack: null,
      isPlaying: false,
      isLoading: false,
      position: 0,
      duration: 0,
      togglePlay: jest.fn().mockResolvedValue(undefined),
      next: jest.fn().mockResolvedValue(undefined),
    });
  });

  it('renders nothing without a current track', () => {
    const { toJSON } = render(<MiniPlayer onPress={jest.fn()} />);
    expect(toJSON()).toBeNull();
  });

  it('renders track details and opens the full player', () => {
    const onPress = jest.fn();
    usePlayerStore.setState({
      currentTrack: track,
      isPlaying: true,
      position: 30_000,
      duration: 120_000,
    });

    render(<MiniPlayer onPress={onPress} />);

    expect(screen.getByText('Mini Song')).toBeTruthy();
    expect(screen.getByText('Mini Artist')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Mini Song - NOW PLAYING'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('handles playback controls without opening the player', () => {
    const onPress = jest.fn();
    const togglePlay = jest.fn().mockResolvedValue(undefined);
    const next = jest.fn().mockResolvedValue(undefined);
    usePlayerStore.setState({
      currentTrack: track,
      isPlaying: false,
      togglePlay,
      next,
    });

    render(<MiniPlayer onPress={onPress} />);

    fireEvent.press(screen.getByLabelText('Play'), { stopPropagation: jest.fn() });
    fireEvent.press(screen.getByLabelText('Next'), { stopPropagation: jest.fn() });

    expect(togglePlay).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();
  });
});
