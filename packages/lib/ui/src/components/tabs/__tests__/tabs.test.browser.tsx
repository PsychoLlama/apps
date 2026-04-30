/**
 * Behavioral tests for Tabs. Runs in a real browser via `@vitest/browser`
 * so focus and keyboard semantics match production. DOM-shape coverage
 * stays in the sibling `tabs.test.tsx` (jsdom).
 */

import { render, screen } from '@solidjs/testing-library';
import { userEvent } from 'vitest/browser';
import { createSignal } from 'solid-js';
import {
  TabsContent,
  TabsList,
  TabsRoot,
  TabsTrigger,
  type TabsListProps,
  type TabsRootProps,
} from '../tabs';

const Tabs = (props: {
  activationMode?: TabsRootProps['activationMode'];
  loop?: TabsListProps['loop'];
}) => {
  const [value, setValue] = createSignal('overview');
  return (
    <TabsRoot
      testId="tabs"
      value={value()}
      onValueChange={setValue}
      activationMode={props.activationMode ?? 'automatic'}
    >
      <TabsList testId="tabs-list" loop={props.loop ?? true}>
        <TabsTrigger testId="tabs-trigger-overview" value="overview">
          Overview
        </TabsTrigger>
        <TabsTrigger testId="tabs-trigger-settings" value="settings">
          Settings
        </TabsTrigger>
        <TabsTrigger testId="tabs-trigger-analytics" value="analytics" disabled>
          Analytics
        </TabsTrigger>
        <TabsTrigger testId="tabs-trigger-billing" value="billing">
          Billing
        </TabsTrigger>
      </TabsList>
      <TabsContent testId="tabs-content-overview" value="overview">
        Overview panel.
      </TabsContent>
      <TabsContent testId="tabs-content-settings" value="settings">
        Settings panel.
      </TabsContent>
      <TabsContent testId="tabs-content-analytics" value="analytics">
        Analytics panel.
      </TabsContent>
      <TabsContent testId="tabs-content-billing" value="billing">
        Billing panel.
      </TabsContent>
    </TabsRoot>
  );
};

describe('Tabs', () => {
  describe('mouse activation', () => {
    it('left-click activates the clicked tab', async () => {
      render(() => <Tabs />);
      const settings = screen.getByTestId('tabs-trigger-settings');

      await userEvent.click(settings);
      expect(screen.getByTestId('tabs-content-settings')).toBeVisible();
    });

    it('right-click does not activate the tab', () => {
      render(() => <Tabs />);
      const settings = screen.getByTestId('tabs-trigger-settings');

      settings.dispatchEvent(
        new MouseEvent('mousedown', { bubbles: true, button: 2 }),
      );
      expect(screen.getByTestId('tabs-content-overview')).toBeVisible();
    });

    it('ctrl+click does not activate the tab (macOS context menu)', () => {
      render(() => <Tabs />);
      const settings = screen.getByTestId('tabs-trigger-settings');

      settings.dispatchEvent(
        new MouseEvent('mousedown', {
          bubbles: true,
          button: 0,
          ctrlKey: true,
        }),
      );
      expect(screen.getByTestId('tabs-content-overview')).toBeVisible();
    });
  });

  describe('keyboard navigation', () => {
    it('ArrowRight skips disabled triggers and activates automatically', async () => {
      render(() => <Tabs />);
      const overview = screen.getByTestId('tabs-trigger-overview');
      const settings = screen.getByTestId('tabs-trigger-settings');
      const billing = screen.getByTestId('tabs-trigger-billing');

      overview.focus();
      await userEvent.keyboard('{ArrowRight}');
      expect(settings).toHaveFocus();
      expect(screen.getByTestId('tabs-content-settings')).toBeVisible();

      // Analytics is disabled — focus jumps past it to Billing.
      await userEvent.keyboard('{ArrowRight}');
      expect(billing).toHaveFocus();
      expect(screen.getByTestId('tabs-content-billing')).toBeVisible();
    });

    it('ArrowRight at the end loops back to the start', async () => {
      render(() => <Tabs />);
      const overview = screen.getByTestId('tabs-trigger-overview');
      const billing = screen.getByTestId('tabs-trigger-billing');

      billing.focus();
      await userEvent.keyboard('{ArrowRight}');
      expect(overview).toHaveFocus();
    });

    it('Home and End jump to the boundary triggers', async () => {
      render(() => <Tabs />);
      const overview = screen.getByTestId('tabs-trigger-overview');
      const billing = screen.getByTestId('tabs-trigger-billing');

      overview.focus();
      await userEvent.keyboard('{End}');
      expect(billing).toHaveFocus();
      await userEvent.keyboard('{Home}');
      expect(overview).toHaveFocus();
    });

    it('PageDown and PageUp mirror End and Home', async () => {
      render(() => <Tabs />);
      const overview = screen.getByTestId('tabs-trigger-overview');
      const billing = screen.getByTestId('tabs-trigger-billing');

      overview.focus();
      await userEvent.keyboard('{PageDown}');
      expect(billing).toHaveFocus();
      await userEvent.keyboard('{PageUp}');
      expect(overview).toHaveFocus();
    });
  });

  describe('activationMode="manual"', () => {
    it('arrow keys move focus only; Space activates', async () => {
      render(() => <Tabs activationMode="manual" />);
      const overview = screen.getByTestId('tabs-trigger-overview');
      const settings = screen.getByTestId('tabs-trigger-settings');

      overview.focus();
      await userEvent.keyboard('{ArrowRight}');
      // Focus moved...
      expect(settings).toHaveFocus();
      // ...but Overview's panel is still the active one.
      expect(screen.getByTestId('tabs-content-overview')).toBeVisible();

      await userEvent.keyboard(' ');
      expect(screen.getByTestId('tabs-content-settings')).toBeVisible();
    });
  });

  describe('loop=false', () => {
    it('arrow nav stops at the boundary instead of wrapping', async () => {
      render(() => <Tabs loop={false} />);
      const billing = screen.getByTestId('tabs-trigger-billing');

      billing.focus();
      await userEvent.keyboard('{ArrowRight}');
      expect(billing).toHaveFocus();
    });
  });

  describe('inactive panels and consumer display styles', () => {
    // The UA `[hidden] { display: none }` rule has specificity (0,0,1),
    // so a consumer class that sets `display: flex` (0,1,0) used to win
    // and keep an inactive panel claiming flex space. The primitive must
    // out-specify a plain class so `hidden` always actually hides.
    it('removes an inactive panel from layout even with a display class', () => {
      const stylesheet = document.createElement('style');
      stylesheet.textContent = `
        .tabs-fixture-rail {
          display: flex;
          flex-direction: column;
          height: 400px;
        }
        .tabs-fixture-panel {
          display: flex;
          flex: 1 1 auto;
          min-height: 0;
        }
      `;
      document.head.appendChild(stylesheet);

      const [value, setValue] = createSignal('overview');

      try {
        render(() => (
          <div class="tabs-fixture-rail">
            <TabsRoot testId="tabs" value={value()} onValueChange={setValue}>
              <TabsList testId="tabs-list">
                <TabsTrigger testId="tabs-trigger-overview" value="overview">
                  Overview
                </TabsTrigger>
                <TabsTrigger testId="tabs-trigger-settings" value="settings">
                  Settings
                </TabsTrigger>
              </TabsList>
              <TabsContent
                testId="tabs-content-overview"
                value="overview"
                class="tabs-fixture-panel"
              >
                Overview panel.
              </TabsContent>
              <TabsContent
                testId="tabs-content-settings"
                value="settings"
                class="tabs-fixture-panel"
              >
                Settings panel.
              </TabsContent>
            </TabsRoot>
          </div>
        ));

        const inactive = screen.getByTestId('tabs-content-settings');
        expect(inactive.offsetHeight).toBe(0);
        expect(inactive.offsetWidth).toBe(0);
      } finally {
        stylesheet.remove();
      }
    });
  });
});
