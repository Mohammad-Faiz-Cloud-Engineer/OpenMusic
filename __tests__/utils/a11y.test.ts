import { a11yButton, a11yHeader, a11yImage } from '../../src/utils/a11y';

describe('a11y helpers', () => {
  it('a11yButton sets role and label', () => {
    const props = a11yButton('Play song');
    expect(props.accessibilityRole).toBe('button');
    expect(props.accessibilityLabel).toBe('Play song');
    expect(props.accessible).toBe(true);
  });

  it('a11yButton includes hint when provided', () => {
    const props = a11yButton('Remove', 'Removes item from queue');
    expect(props.accessibilityHint).toBe('Removes item from queue');
  });

  it('a11yHeader sets header role', () => {
    expect(a11yHeader('Trending').accessibilityRole).toBe('header');
  });

  it('a11yImage sets image role', () => {
    expect(a11yImage('Album art').accessibilityRole).toBe('image');
  });
});
