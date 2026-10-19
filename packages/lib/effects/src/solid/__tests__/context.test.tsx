import { render } from '@solidjs/testing-library';
import { createEffect } from 'solid-js';
import type { Controller } from '../../controller/controller';
import { DEFAULT_CONTROLLER } from '../../controller/default';
import { createTestController } from '../../testing';
import { EffectsRoot, useController, useMounted } from '../context';

describe('EffectsRoot', () => {
  it('reads unmounted during setup, then mounted', () => {
    const setups: boolean[] = [];
    const effects: boolean[] = [];

    const Probe = () => {
      const mounted = useMounted();
      setups.push(mounted());
      createEffect(() => effects.push(mounted()));

      return <>{mounted() ? 'mounted' : 'pending'}</>;
    };

    const { container } = render(() => (
      <EffectsRoot>
        <Probe />
      </EffectsRoot>
    ));

    // Set up once, before mount; mounting doesn't rebuild the subtree.
    expect(setups).toEqual([false]);
    expect(effects.at(-1)).toBe(true);
    expect(container).toHaveTextContent('mounted');
  });

  it('provides the default controller unless given another', () => {
    const seen: Controller[] = [];
    const Probe = () => {
      seen.push(useController());
      return null;
    };
    const { controller } = createTestController();

    render(() => (
      <>
        <EffectsRoot>
          <Probe />
        </EffectsRoot>
        <EffectsRoot controller={controller}>
          <Probe />
        </EffectsRoot>
      </>
    ));

    expect(seen).toEqual([DEFAULT_CONTROLLER, controller]);
  });

  it.each([useMounted, useController])('demands a root above %o', (hook) => {
    const Orphan = () => {
      hook();
      return null;
    };

    expect(() => render(() => <Orphan />)).toThrow(
      '<EffectsRoot> required but not provided.',
    );
  });
});
