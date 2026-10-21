import { collect } from '@lib/effects';
import { $restoreContacts } from './contacts';
import { $restoreOnboarding } from './onboarding';

/**
 * Everything beam reads back off disk before it can pick a screen: the
 * address book, this device's own row, and how far setup has got. The two
 * reads are independent and both answer long before the relay does.
 */
export const $restoreFromDisk = collect([$restoreContacts, $restoreOnboarding]);
