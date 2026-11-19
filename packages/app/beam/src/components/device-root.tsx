import type { JSX } from 'solid-js';
import { useClientValue } from '@lib/effects/solid';
import { $openDevice } from '../effects';

/**
 * Holds the device open for as long as the app is, above the routes.
 *
 * A plan lives while something holds it. Held by each page, the device
 * closed and opened again on every navigation: the worker ended, the next
 * one waited for the store, and invitations and connections went with
 * it.
 *
 * Neither the worker nor IndexedDB can run during SSG, so it opens once
 * the client mounts.
 */
export const DeviceRoot = (props: { children: JSX.Element }) => {
  useClientValue($openDevice);

  return <>{props.children}</>;
};
