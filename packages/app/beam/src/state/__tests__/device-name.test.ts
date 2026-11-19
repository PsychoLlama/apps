/** Unit tests for what a device is called. */

import {
  DEVICE_NAME_MAX_LENGTH,
  deviceLabel,
  inferDeviceName,
  normalizeDeviceName,
} from '../device-name';

describe('inferDeviceName', () => {
  it.each([
    [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
      'iPhone',
    ],
    [
      'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
      'iPad',
    ],
    [
      'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36',
      'Android phone',
    ],
    [
      'Mozilla/5.0 (Linux; Android 14; SM-X910) AppleWebKit/537.36 Chrome/130.0 Safari/537.36',
      'Android tablet',
    ],
    [
      'Mozilla/5.0 (X11; CrOS x86_64 15917.71.0) AppleWebKit/537.36 Chrome/127.0 Safari/537.36',
      'Chromebook',
    ],
    [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15',
      'Mac',
    ],
    [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0',
      'Windows PC',
    ],
    [
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36',
      'Linux PC',
    ],
    ['', 'Device'],
    ['curl/8.0', 'Device'],
  ])('guesses from %s', (userAgent, name) => {
    expect(inferDeviceName(userAgent)).toBe(name);
  });

  it('says nothing of the browser, its version, or the model', () => {
    const name = inferDeviceName(
      'Mozilla/5.0 (Linux; Android 15; Pixel 9 Pro) AppleWebKit/537.36 Chrome/130.0.6723.58 Mobile Safari/537.36',
    );

    expect(name).not.toMatch(/Pixel|Chrome|130|15/);
  });
});

describe('normalizeDeviceName', () => {
  it('trims', () => {
    expect(normalizeDeviceName('  Desk  ')).toBe('Desk');
  });

  it('refuses nothing, and too much', () => {
    expect(normalizeDeviceName('   ')).toBeNull();
    expect(normalizeDeviceName('x'.repeat(DEVICE_NAME_MAX_LENGTH))).not.toBe(
      null,
    );
    expect(
      normalizeDeviceName('x'.repeat(DEVICE_NAME_MAX_LENGTH + 1)),
    ).toBeNull();
  });
});

describe('deviceLabel', () => {
  it('falls back for a device that has not said', () => {
    expect(deviceLabel({ name: 'Desk' })).toBe('Desk');
    expect(deviceLabel({ name: '' })).toBe('Unnamed device');
  });
});
