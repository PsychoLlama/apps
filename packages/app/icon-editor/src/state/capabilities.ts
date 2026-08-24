/**
 * Every side effect the editor's sagas reach for, as plain functions
 * that take the governing `AbortSignal` first and know nothing about
 * state. Each call is its own request — nothing is cached here, so the
 * signal goes straight to `fetch` and a released scope tears the request
 * down instead of leaving it to settle unwanted.
 */

/// <reference types="@dev/build/vite-plugin/icon-packs-types" />

import { createLogger, toError } from '@lib/observability';
import indexUrl from 'virtual:icon-packs';
import type {
  IconEntry,
  IconIndexPayload,
  IconPackManifest,
  IconPackSummary,
  IconPageRequest,
  IconPageResult,
} from '../icons';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

/** A non-OK response from an icon-asset fetch, carrying the URL and status. */
class IconAssetError extends Error {
  readonly url: string;
  readonly status: number;

  constructor(url: string, status: number) {
    super(`Failed to fetch ${url}: ${status}`);
    this.name = 'IconAssetError';
    this.url = url;
    this.status = status;
  }
}

const fetchJson = async <T>(signal: AbortSignal, url: string): Promise<T> => {
  try {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new IconAssetError(url, response.status);
    }
    return (await response.json()) as T;
  } catch (error) {
    // The choke point for every asset fetch — otherwise these fail
    // silently and the picker just spins on "Loading…".
    logger.warn('Icon asset request failed.', { url, error: toError(error) });
    throw error;
  }
};

/** Load the pack catalog. */
export const fetchPackIndex = async (
  signal: AbortSignal,
): Promise<IconPackSummary[]> => {
  const payload = await fetchJson<IconIndexPayload>(signal, indexUrl);
  return payload.packs;
};

/** Load one pack's manifest — names plus the URLs of its body chunks. */
export const fetchPackManifest = (
  signal: AbortSignal,
  pack: IconPackSummary,
): Promise<IconPackManifest> =>
  fetchJson<IconPackManifest>(signal, pack.manifestUrl);

/** Load a single body chunk, preserving the request that asked for it. */
export const fetchPageEntries = async (
  signal: AbortSignal,
  request: IconPageRequest,
): Promise<IconPageResult> => {
  const entries = await fetchJson<IconEntry[]>(signal, request.pageUrl);
  return { packId: request.packId, pageUrl: request.pageUrl, entries };
};

/**
 * Roll an index below `count`. Non-determinism is a side effect like any
 * other, so it lives here rather than inside a saga — which is what lets
 * `simulate` pin the roll and assert on the icon Randomize lands.
 */
export const rollIndex = (_signal: AbortSignal, count: number): number =>
  Math.floor(Math.random() * count);
