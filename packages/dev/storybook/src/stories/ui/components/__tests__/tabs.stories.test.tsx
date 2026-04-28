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
// Cast back to renderable Solid components.
const { Tabs, TabsManualActivation, TabsNoLoop } = composeStories(
  stories as never,
  annotations,
) as unknown as {
  Tabs: Component;
  TabsManualActivation: Component;
  TabsNoLoop: Component;
};

describe('Tabs', () => {
  it('mouse + keyboard activation', async () => {
    const { container } = render(() => <Tabs />);
    const canvas = within(container);

    const overview = canvas.getByTestId('tabs-trigger-overview');
    const settings = canvas.getByTestId('tabs-trigger-settings');
    const billing = canvas.getByTestId('tabs-trigger-billing');

    // --- mouse activation ---
    await userEvent.click(settings);
    await expect(canvas.getByTestId('tabs-content-settings')).toBeVisible();

    // --- right-click does NOT activate ---
    await userEvent.click(overview);
    await expect(canvas.getByTestId('tabs-content-overview')).toBeVisible();
    settings.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, button: 2 }),
    );
    await expect(canvas.getByTestId('tabs-content-overview')).toBeVisible();

    // --- ctrl+click does NOT activate (macOS context menu) ---
    settings.dispatchEvent(
      new MouseEvent('mousedown', {
        bubbles: true,
        button: 0,
        ctrlKey: true,
      }),
    );
    await expect(canvas.getByTestId('tabs-content-overview')).toBeVisible();

    // --- ArrowRight: skip disabled, automatic activation ---
    overview.focus();
    await expect(overview).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(settings).toHaveFocus();
    await expect(canvas.getByTestId('tabs-content-settings')).toBeVisible();
    await userEvent.keyboard('{ArrowRight}');
    // Analytics is disabled — focus jumps past it to Billing
    await expect(billing).toHaveFocus();
    await expect(canvas.getByTestId('tabs-content-billing')).toBeVisible();

    // --- loop wraps from last to first ---
    await userEvent.keyboard('{ArrowRight}');
    await expect(overview).toHaveFocus();

    // --- Home / End ---
    await userEvent.keyboard('{End}');
    await expect(billing).toHaveFocus();
    await userEvent.keyboard('{Home}');
    await expect(overview).toHaveFocus();

    // --- PageDown / PageUp mirror End / Home ---
    await userEvent.keyboard('{PageDown}');
    await expect(billing).toHaveFocus();
    await userEvent.keyboard('{PageUp}');
    await expect(overview).toHaveFocus();
  });

  it('manual activation requires Space or Enter', async () => {
    const { container } = render(() => <TabsManualActivation />);
    const canvas = within(container);
    const overview = canvas.getByTestId('tabs-trigger-overview');
    const settings = canvas.getByTestId('tabs-trigger-settings');

    overview.focus();
    await userEvent.keyboard('{ArrowRight}');
    // Focus moved...
    await expect(settings).toHaveFocus();
    // ...but Overview's panel is still the active one.
    await expect(canvas.getByTestId('tabs-content-overview')).toBeVisible();

    // Space activates.
    await userEvent.keyboard(' ');
    await expect(canvas.getByTestId('tabs-content-settings')).toBeVisible();
  });

  it('loop=false stops at the boundary', async () => {
    const { container } = render(() => <TabsNoLoop />);
    const canvas = within(container);
    const billing = canvas.getByTestId('tabs-trigger-billing');

    billing.focus();
    await userEvent.keyboard('{ArrowRight}');
    // Should stay on billing — no wrap.
    await expect(billing).toHaveFocus();
  });
});
