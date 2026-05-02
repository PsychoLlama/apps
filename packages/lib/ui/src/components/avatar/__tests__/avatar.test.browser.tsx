/**
 * Behavioral tests for Avatar.
 *
 * The component drives its own load-state machine off a detached
 * `Image` instance, so the real browser is the only place these
 * transitions actually fire — JSDOM doesn't load images and would let
 * a regression slip through silently.
 */

import { render, screen, waitFor } from '@solidjs/testing-library';
import Avatar from '../avatar';

// 1x1 transparent PNG. Always loads; useful for asserting the loaded
// state without going to the network.
const SAMPLE_SRC =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const BROKEN_SRC = 'data:image/png;base64,not-a-valid-image';

describe('Avatar', () => {
  // --- DOM shape ---

  it('renders a span with role="img" and the alt as aria-label', () => {
    render(() => <Avatar testId="av" alt="Jane Doe" fallback="JD" />);
    const root = screen.getByTestId('av');
    expect(root.tagName).toBe('SPAN');
    expect(root).toHaveAttribute('role', 'img');
    expect(root).toHaveAttribute('aria-label', 'Jane Doe');
  });

  // --- Fallback path ---

  it('renders the fallback immediately when src is absent', () => {
    render(() => <Avatar testId="av" alt="Jane Doe" fallback="JD" />);
    expect(screen.getByTestId('av')).toHaveTextContent('JD');
    expect(screen.getByTestId('av').querySelector('img')).toBeNull();
  });

  it('hides the fallback from assistive tech', () => {
    render(() => <Avatar testId="av" alt="Jane Doe" fallback="JD" />);
    const fallback = screen.getByTestId('av').querySelector('span')!;
    expect(fallback).toHaveAttribute('aria-hidden', 'true');
  });

  // --- Loaded path ---

  it('shows the image and removes the fallback once src loads', async () => {
    render(() => (
      <Avatar testId="av" alt="Jane Doe" fallback="JD" src={SAMPLE_SRC} />
    ));
    await waitFor(() => {
      expect(screen.getByTestId('av').querySelector('img')).not.toBeNull();
    });
    const root = screen.getByTestId('av');
    expect(root.querySelector('img')).toHaveAttribute('alt', '');
    // No fallback span once the image is in.
    expect(root.querySelector('span[aria-hidden="true"]')).toBeNull();
  });

  // --- Error path ---

  it('keeps the fallback visible when the image errors', async () => {
    render(() => (
      <Avatar testId="av" alt="Jane Doe" fallback="JD" src={BROKEN_SRC} />
    ));
    await waitFor(() => {
      const root = screen.getByTestId('av');
      expect(root.querySelector('img')).toBeNull();
      expect(root).toHaveTextContent('JD');
    });
  });

  // --- delayMs gate ---

  it('hides the fallback until delayMs elapses', async () => {
    render(() => (
      <Avatar
        testId="av"
        alt="Jane Doe"
        fallback="JD"
        src={BROKEN_SRC}
        delayMs={150}
      />
    ));
    // Synchronous check: fallback is not in the tree yet.
    expect(screen.getByTestId('av').querySelector('span')).toBeNull();

    await waitFor(
      () => {
        expect(screen.getByTestId('av')).toHaveTextContent('JD');
      },
      { timeout: 1000 },
    );
  });
});
