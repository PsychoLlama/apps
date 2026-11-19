/** Unit tests for the invitation on screen and the link that carries it. */

import { createTestController } from '@lib/effects/testing';
import {
  $invite,
  $inviteClosed,
  $inviteOpened,
  inviteCodeOf,
  inviteLink,
  type Invite,
} from '../invite';

const CODE = 'ab'.repeat(48);

const invite: Invite = {
  groupId: 'aaaa',
  code: CODE,
  link: `https://beam.example/join/#${CODE}`,
  grid: null,
};

describe('$invite', () => {
  it('starts out showing nothing', async () => {
    await using effects = createTestController();
    const shown = await effects.run($invite);

    expect(shown()).toBeNull();
  });

  it('shows an invitation, then puts it away', async () => {
    await using effects = createTestController();
    const shown = await effects.run($invite);
    const inviteOpened = await effects.run($inviteOpened);
    const inviteClosed = await effects.run($inviteClosed);

    inviteOpened(invite);
    expect(shown()).toEqual(invite);

    inviteClosed();
    expect(shown()).toBeNull();
  });
});

describe('inviteLink', () => {
  it('carries the code in the fragment, where servers never see it', () => {
    const link = new URL(inviteLink('https://beam.example', CODE));

    expect(link.pathname).toBe('/join/');
    expect(link.search).toBe('');
    expect(link.hash).toBe(`#${CODE}`);
  });

  it('round-trips through the fragment', () => {
    const link = new URL(inviteLink('https://beam.example', CODE));

    expect(inviteCodeOf(link.hash)).toBe(CODE);
  });
});

describe('inviteCodeOf', () => {
  it('refuses anything that is not a code', () => {
    expect(inviteCodeOf('')).toBeNull();
    expect(inviteCodeOf('#')).toBeNull();
    expect(inviteCodeOf(`#${CODE}0`)).toBeNull();
    expect(inviteCodeOf(`#${CODE.toUpperCase()}`)).toBeNull();
    expect(inviteCodeOf('#<script>')).toBeNull();
  });
});
