import { requestOpenFullPlayer, rootNavigationRef } from '../../src/navigation/rootNavigation';

describe('rootNavigation', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does nothing when the navigation container is not ready', () => {
    const navigateSpy = jest.spyOn(rootNavigationRef, 'navigate');
    jest.spyOn(rootNavigationRef, 'isReady').mockReturnValue(false);

    requestOpenFullPlayer();

    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('opens the Player screen when navigation is ready', () => {
    const navigateSpy = jest.spyOn(rootNavigationRef, 'navigate').mockImplementation(() => {});
    jest.spyOn(rootNavigationRef, 'isReady').mockReturnValue(true);

    requestOpenFullPlayer();

    expect(navigateSpy).toHaveBeenCalledWith('Player');
  });
});
