import NetInfo from '@react-native-community/netinfo';
import { act, renderHook } from '@testing-library/react-native';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';

type NetInfoState = Parameters<Parameters<typeof NetInfo.addEventListener>[0]>[0];

describe('useNetworkStatus', () => {
  beforeEach(() => {
    jest.mocked(NetInfo.addEventListener).mockReset();
  });

  it('subscribes to NetInfo, updates online state, and unsubscribes on unmount', () => {
    let listener: ((state: NetInfoState) => void) | undefined;
    const unsubscribe = jest.fn();
    jest.mocked(NetInfo.addEventListener).mockImplementation((cb) => {
      listener = cb;
      return unsubscribe;
    });

    const { result, unmount } = renderHook(() => useNetworkStatus());

    expect(result.current.isOnline).toBe(true);

    act(() => {
      listener?.({ isConnected: false, isInternetReachable: true } as NetInfoState);
    });
    expect(result.current.isOnline).toBe(false);

    act(() => {
      listener?.({ isConnected: true, isInternetReachable: true } as NetInfoState);
    });
    expect(result.current.isOnline).toBe(true);

    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
