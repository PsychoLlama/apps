import { expect, screen, userEvent } from 'storybook/test';
import { composeStories } from '../../../../compose-stories';
import * as stories from '../tabs.stories';

const { Tabs } = composeStories(stories);

describe('Tabs', () => {
  describe('mouse activation', () => {
    it('left-click activates the clicked tab', async () => {
      await Tabs.run();
      const settings = screen.getByTestId('tabs-trigger-settings');

      await userEvent.click(settings);
      await expect(screen.getByTestId('tabs-content-settings')).toBeVisible();
    });

    it('right-click does not activate the tab', async () => {
      await Tabs.run();
      const settings = screen.getByTestId('tabs-trigger-settings');

      settings.dispatchEvent(
        new MouseEvent('mousedown', { bubbles: true, button: 2 }),
      );
      await expect(screen.getByTestId('tabs-content-overview')).toBeVisible();
    });

    it('ctrl+click does not activate the tab (macOS context menu)', async () => {
      await Tabs.run();
      const settings = screen.getByTestId('tabs-trigger-settings');

      settings.dispatchEvent(
        new MouseEvent('mousedown', {
          bubbles: true,
          button: 0,
          ctrlKey: true,
        }),
      );
      await expect(screen.getByTestId('tabs-content-overview')).toBeVisible();
    });
  });

  describe('keyboard navigation', () => {
    it('ArrowRight skips disabled triggers and activates automatically', async () => {
      await Tabs.run();
      const overview = screen.getByTestId('tabs-trigger-overview');
      const settings = screen.getByTestId('tabs-trigger-settings');
      const billing = screen.getByTestId('tabs-trigger-billing');

      overview.focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(settings).toHaveFocus();
      await expect(screen.getByTestId('tabs-content-settings')).toBeVisible();

      // Analytics is disabled — focus jumps past it to Billing.
      await userEvent.keyboard('{ArrowRight}');
      await expect(billing).toHaveFocus();
      await expect(screen.getByTestId('tabs-content-billing')).toBeVisible();
    });

    it('ArrowRight at the end loops back to the start', async () => {
      await Tabs.run();
      const overview = screen.getByTestId('tabs-trigger-overview');
      const billing = screen.getByTestId('tabs-trigger-billing');

      billing.focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(overview).toHaveFocus();
    });

    it('Home and End jump to the boundary triggers', async () => {
      await Tabs.run();
      const overview = screen.getByTestId('tabs-trigger-overview');
      const billing = screen.getByTestId('tabs-trigger-billing');

      overview.focus();
      await userEvent.keyboard('{End}');
      await expect(billing).toHaveFocus();
      await userEvent.keyboard('{Home}');
      await expect(overview).toHaveFocus();
    });

    it('PageDown and PageUp mirror End and Home', async () => {
      await Tabs.run();
      const overview = screen.getByTestId('tabs-trigger-overview');
      const billing = screen.getByTestId('tabs-trigger-billing');

      overview.focus();
      await userEvent.keyboard('{PageDown}');
      await expect(billing).toHaveFocus();
      await userEvent.keyboard('{PageUp}');
      await expect(overview).toHaveFocus();
    });
  });

  describe('activationMode="manual"', () => {
    it('arrow keys move focus only; Space activates', async () => {
      await Tabs.run({ args: { ...Tabs.args, activationMode: 'manual' } });
      const overview = screen.getByTestId('tabs-trigger-overview');
      const settings = screen.getByTestId('tabs-trigger-settings');

      overview.focus();
      await userEvent.keyboard('{ArrowRight}');
      // Focus moved...
      await expect(settings).toHaveFocus();
      // ...but Overview's panel is still the active one.
      await expect(screen.getByTestId('tabs-content-overview')).toBeVisible();

      await userEvent.keyboard(' ');
      await expect(screen.getByTestId('tabs-content-settings')).toBeVisible();
    });
  });

  describe('loop=false', () => {
    it('arrow nav stops at the boundary instead of wrapping', async () => {
      await Tabs.run({ args: { ...Tabs.args, loop: false } });
      const billing = screen.getByTestId('tabs-trigger-billing');

      billing.focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(billing).toHaveFocus();
    });
  });
});
