import { useToastStore } from '../../src/store/toastStore';

describe('toastStore', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    useToastStore.setState({ message: '', visible: false });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('shows a message and auto-hides it', () => {
    useToastStore.getState().show('Saved');
    expect(useToastStore.getState()).toMatchObject({ message: 'Saved', visible: true });

    jest.advanceTimersByTime(2500);
    expect(useToastStore.getState().visible).toBe(false);
  });

  it('replaces the active toast timer when showing another message', () => {
    useToastStore.getState().show('First');
    jest.advanceTimersByTime(1000);
    useToastStore.getState().show('Second');
    jest.advanceTimersByTime(1500);

    expect(useToastStore.getState()).toMatchObject({ message: 'Second', visible: true });

    jest.advanceTimersByTime(1000);
    expect(useToastStore.getState().visible).toBe(false);
  });

  it('hides immediately and clears the timer', () => {
    useToastStore.getState().show('Saved');
    useToastStore.getState().hide();
    jest.advanceTimersByTime(2500);

    expect(useToastStore.getState().visible).toBe(false);
  });
});
