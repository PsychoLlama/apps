/**
 * Unit tests for Tabs.
 *
 * Scope: DOM-shape assertions — ARIA wiring, ID minting, hidden-panel
 * state, roving tabindex on initial render, IDREF validity. These run
 * fast in JSDOM and don't depend on real layout or focus semantics.
 *
 * Interaction lives in Storybook (`packages/dev/storybook/src/stories/
 * ui/components/tabs.stories.tsx`). Anything that needs real browser
 * focus, the actual mouse-button event model, `:focus-visible`, or
 * roving-focus traversal goes there: keyboard nav (arrows / Home / End
 * / PageUp / PageDown), loop wrap-around, skip-disabled, manual vs
 * automatic activation, and the mousedown right-click / ctrl-click
 * filter. JSDOM approximates all of those well enough to *almost*
 * pass — which is the worst kind of test coverage.
 */

import { createSignal, untrack } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from '../tabs';

const Harness = (overrides: { initialValue?: string; prefix?: string }) => {
  const prefix = untrack(() => overrides.prefix ?? 'tabs');
  const [value, setValue] = createSignal(
    untrack(() => overrides.initialValue ?? 'one'),
  );
  return (
    <TabsRoot
      testId={`${prefix}-root`}
      value={value()}
      onValueChange={setValue}
    >
      <TabsList testId={`${prefix}-list`}>
        <TabsTrigger testId={`${prefix}-trigger-one`} value="one">
          One
        </TabsTrigger>
        <TabsTrigger testId={`${prefix}-trigger-two`} value="two" disabled>
          Two
        </TabsTrigger>
        <TabsTrigger testId={`${prefix}-trigger-three`} value="three">
          Three
        </TabsTrigger>
      </TabsList>
      <TabsContent testId={`${prefix}-content-one`} value="one">
        Panel one
      </TabsContent>
      <TabsContent testId={`${prefix}-content-two`} value="two">
        Panel two
      </TabsContent>
      <TabsContent testId={`${prefix}-content-three`} value="three">
        Panel three
      </TabsContent>
    </TabsRoot>
  );
};

describe('Tabs', () => {
  it('renders the active panel visible and others mounted but hidden', () => {
    render(() => <Harness initialValue="three" />);

    const active = screen.getByTestId('tabs-content-three');
    const inactiveOne = screen.getByTestId('tabs-content-one');
    const inactiveTwo = screen.getByTestId('tabs-content-two');

    expect(active).toBeVisible();
    expect(active).toHaveTextContent('Panel three');
    expect(inactiveOne).not.toBeVisible();
    expect(inactiveOne).toBeEmptyDOMElement();
    expect(inactiveTwo).not.toBeVisible();
    expect(inactiveTwo).toBeEmptyDOMElement();
  });

  it('keeps every trigger pointing at a panel that exists in the DOM', () => {
    render(() => <Harness initialValue="one" />);

    for (const value of ['one', 'two', 'three']) {
      const trigger = screen.getByTestId(`tabs-trigger-${value}`);
      const panelId = trigger.getAttribute('aria-controls');
      expect(panelId).toBeTruthy();
      expect(document.getElementById(panelId!)).not.toBeNull();
    }
  });

  it('wires aria-controls / aria-labelledby between trigger and panel', () => {
    render(() => <Harness initialValue="one" />);

    const trigger = screen.getByTestId('tabs-trigger-one');
    const panel = screen.getByTestId('tabs-content-one');

    expect(trigger).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveAttribute('aria-labelledby', trigger.id);
  });

  it('mints unique ids per <TabsRoot> instance', () => {
    render(() => (
      <>
        <Harness prefix="a" initialValue="one" />
        <Harness prefix="b" initialValue="one" />
      </>
    ));

    const triggerA = screen.getByTestId('a-trigger-one');
    const triggerB = screen.getByTestId('b-trigger-one');
    expect(triggerA.id).not.toBe(triggerB.id);
  });

  it('roving tabindex follows the active value, skipping disabled', () => {
    render(() => <Harness initialValue="three" />);

    expect(screen.getByTestId('tabs-trigger-one')).toHaveAttribute(
      'tabindex',
      '-1',
    );
    expect(screen.getByTestId('tabs-trigger-two')).toHaveAttribute(
      'tabindex',
      '-1',
    );
    expect(screen.getByTestId('tabs-trigger-three')).toHaveAttribute(
      'tabindex',
      '0',
    );
  });

  it('produces valid IDREFs even when the value contains whitespace', () => {
    const [value, setValue] = createSignal('team settings');
    render(() => (
      <TabsRoot testId="root" value={value()} onValueChange={setValue}>
        <TabsList testId="list">
          <TabsTrigger testId="trigger" value="team settings">
            Team Settings
          </TabsTrigger>
        </TabsList>
        <TabsContent testId="content" value="team settings">
          Panel
        </TabsContent>
      </TabsRoot>
    ));

    const trigger = screen.getByTestId('trigger');
    const panel = screen.getByTestId('content');
    expect(trigger.id).not.toContain(' ');
    expect(panel.id).not.toContain(' ');
    expect(trigger).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveAttribute('aria-labelledby', trigger.id);
  });

  it('renders a button with the disabled attribute when disabled', () => {
    render(() => <Harness initialValue="one" />);

    expect(screen.getByTestId('tabs-trigger-two')).toBeDisabled();
  });
});
