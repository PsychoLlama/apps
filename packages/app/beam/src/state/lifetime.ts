import { collect } from '@lib/effects';
import { $connection } from './connection';
import { $contacts } from './contacts';
import { $invite, $removal, $rename } from './dialogs';
import { $identity, $qrCode } from './identity';
import { $onboarding, $setupDraft } from './onboarding';
import { $peerHandles, $peerLinks } from './peers';
import { $drafts, $shareLog } from './shares';

/**
 * Every store a beam session owns, held as one. The layout holds it for the
 * life of the app, so moving between routes keeps one loaded address book,
 * one share log, and every half-written draft rather than starting over.
 */
export const $beamLifetime = collect([
  $connection,
  $contacts,
  $drafts,
  $identity,
  $invite,
  $onboarding,
  $peerHandles,
  $peerLinks,
  $qrCode,
  $removal,
  $rename,
  $setupDraft,
  $shareLog,
]);
