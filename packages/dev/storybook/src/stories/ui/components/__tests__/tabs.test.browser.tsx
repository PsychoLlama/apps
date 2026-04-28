import { render } from '@solidjs/testing-library';
import { composeStories } from 'storybook/preview-api';
import { setProjectAnnotations } from 'storybook-solidjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import type { Component } from 'solid-js';
import projectAnnotations from '../../../../../.storybook/preview';
import * as stories from '../tabs.stories';

const annotations = setProjectAnnotations([projectAnnotations]);

// `composeStories` from `storybook/preview-api` is typed against a generic
// renderer; the Solid Vite framework doesn't ship its own typed wrapper.
// Cast back to a renderable Solid component that takes the story's args
// as props (so individual tests can override `activationMode`/`loop`).
const { Tabs } = composeStories(stories as never, annotations) as unknown as {
  Tabs: Component<{
    activationMode?: 'automatic' | 'manual';
    loop?: boolean;
  }>;
};

describe('Tabs', () => {
  describe('mouse activation', () => {
    it('left-click activates the clicked tab', async () => {
      const { container } = render(() => <Tabs />);
      const canvas = within(container);
      const settings = canvas.getByTestId('tabs-trigger-settings');

      await userEvent.click(settings);
      await expect(canvas.getByTestId('tabs-content-settings')).toBeVisible();
    });

    it('right-click does not activate the tab', async () => {
      const { container } = render(() => <Tabs />);
      const canvas = within(container);
      const settings = canvas.getByTestId('tabs-trigger-settings');

      settings.dispatchEvent(
        new MouseEvent('mousedown', { bubbles: true, button: 2 }),
      );
      await expect(canvas.getByTestId('tabs-content-overview')).toBeVisible();
    });

    it('ctrl+click does not activate the tab (macOS context menu)', async () => {
      const { container } = render(() => <Tabs />);
      const canvas = within(container);
      const settings = canvas.getByTestId('tabs-trigger-settings');

      settings.dispatchEvent(
        new MouseEvent('mousedown', {
          bubbles: true,
          button: 0,
          ctrlKey: true,
        }),
      );
      await expect(canvas.getByTestId('tabs-content-overview')).toBeVisible();
    });
  });

  describe('keyboard navigation', () => {
    it('ArrowRight skips disabled triggers and activates automatically', async () => {
      const { container } = render(() => <Tabs />);
      const canvas = within(container);
      const overview = canvas.getByTestId('tabs-trigger-overview');
      const settings = canvas.getByTestId('tabs-trigger-settings');
      const billing = canvas.getByTestId('tabs-trigger-billing');

      overview.focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(settings).toHaveFocus();
      await expect(canvas.getByTestId('tabs-content-settings')).toBeVisible();

      // Analytics is disabled — focus jumps past it to Billing.
      await userEvent.keyboard('{ArrowRight}');
      await expect(billing).toHaveFocus();
      await expect(canvas.getByTestId('tabs-content-billing')).toBeVisible();
    });

    it('ArrowRight at the end loops back to the start', async () => {
      const { container } = render(() => <Tabs />);
      const canvas = within(container);
      const overview = canvas.getByTestId('tabs-trigger-overview');
      const billing = canvas.getByTestId('tabs-trigger-billing');

      billing.focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(overview).toHaveFocus();
    });

    it('Home and End jump to the boundary triggers', async () => {
      const { container } = render(() => <Tabs />);
      const canvas = within(container);
      const overview = canvas.getByTestId('tabs-trigger-overview');
      const billing = canvas.getByTestId('tabs-trigger-billing');

      overview.focus();
      await userEvent.keyboard('{End}');
      await expect(billing).toHaveFocus();
      await userEvent.keyboard('{Home}');
      await expect(overview).toHaveFocus();
    });

    it('PageDown and PageUp mirror End and Home', async () => {
      const { container } = render(() => <Tabs />);
      const canvas = within(container);
      const overview = canvas.getByTestId('tabs-trigger-overview');
      const billing = canvas.getByTestId('tabs-trigger-billing');

      overview.focus();
      await userEvent.keyboard('{PageDown}');
      await expect(billing).toHaveFocus();
      await userEvent.keyboard('{PageUp}');
      await expect(overview).toHaveFocus();
    });
  });

  describe('activationMode="manual"', () => {
    it('arrow keys move focus only; Space activates', async () => {
      const { container } = render(() => <Tabs activationMode="manual" />);
      const canvas = within(container);
      const overview = canvas.getByTestId('tabs-trigger-overview');
      const settings = canvas.getByTestId('tabs-trigger-settings');

      overview.focus();
      await userEvent.keyboard('{ArrowRight}');
      // Focus moved...
      await expect(settings).toHaveFocus();
      // ...but Overview's panel is still the active one.
      await expect(canvas.getByTestId('tabs-content-overview')).toBeVisible();

      await userEvent.keyboard(' ');
      await expect(canvas.getByTestId('tabs-content-settings')).toBeVisible();
    });
  });

  describe('loop=false', () => {
    it('arrow nav stops at the boundary instead of wrapping', async () => {
      const { container } = render(() => <Tabs loop={false} />);
      const canvas = within(container);
      const billing = canvas.getByTestId('tabs-trigger-billing');

      billing.focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(billing).toHaveFocus();
    });
  });
});
