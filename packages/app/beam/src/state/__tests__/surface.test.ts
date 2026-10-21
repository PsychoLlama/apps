/** Unit tests for picking which of beam's screens to show. */

import { surfaceForRoute, surfaceOf } from '../surface';

describe('surfaceOf', () => {
  it.each([
    ['naming', 'naming'],
    ['pairing', 'pairing'],
    ['done', 'session'],
  ] as const)('shows %s as %s', (step, surface) => {
    expect(surfaceOf({ step, updatedAt: null })).toBe(surface);
  });
});

describe('surfaceForRoute', () => {
  it('lets a beam link through step two', () => {
    expect(surfaceForRoute('pairing', '/share/ep-1')).toBe('session');
  });

  it('keeps step two everywhere else', () => {
    expect(surfaceForRoute('pairing', '/')).toBe('pairing');
  });

  it('never lets a beam link past step one', () => {
    expect(surfaceForRoute('naming', '/share/ep-1')).toBe('naming');
  });

  it('leaves the session alone', () => {
    expect(surfaceForRoute('session', '/')).toBe('session');
  });
});
