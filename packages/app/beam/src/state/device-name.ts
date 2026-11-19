/**
 * What a device is called.
 *
 * Nobody is asked to name a device before using it. It starts with a guess
 * and is renamed whenever someone cares to.
 *
 * Free of imports, so the worker can use it without the page's state.
 */

/** Longest name a device can be given. A label. */
export const DEVICE_NAME_MAX_LENGTH = 40;

/**
 * A first name for this device, guessed from its user agent.
 *
 * Deliberately vague: the kind of thing it is, and nothing about which
 * one. The name is shown to everyone in every group the device joins, and
 * some of those are other people. A browser, a version, or a model would
 * tell them more than a label needs to.
 *
 * It only has to be good enough to tell two devices apart at a glance.
 */
export const inferDeviceName = (userAgent: string): string => {
  if (/iPhone|iPod/.test(userAgent)) return 'iPhone';
  if (/iPad/.test(userAgent)) return 'iPad';

  if (/Android/.test(userAgent)) {
    return /Mobile/.test(userAgent) ? 'Android phone' : 'Android tablet';
  }

  if (/CrOS/.test(userAgent)) return 'Chromebook';
  if (/Macintosh|Mac OS X/.test(userAgent)) return 'Mac';
  if (/Windows/.test(userAgent)) return 'Windows PC';
  if (/Linux|X11/.test(userAgent)) return 'Linux PC';

  return 'Device';
};

/**
 * A device name as it's stored: trimmed, or `null` if nothing is left or
 * it runs too long.
 */
export const normalizeDeviceName = (name: string): string | null => {
  const trimmed = name.trim();

  return trimmed.length > 0 && trimmed.length <= DEVICE_NAME_MAX_LENGTH
    ? trimmed
    : null;
};

/** What to call a device on screen. One that hasn't said has no name. */
export const deviceLabel = (device: { readonly name: string }): string =>
  device.name || 'Unnamed device';
