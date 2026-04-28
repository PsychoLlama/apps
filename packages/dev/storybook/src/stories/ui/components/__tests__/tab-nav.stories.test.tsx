import { render } from '@solidjs/testing-library';
import { composeStories } from 'storybook/preview-api';
import { setProjectAnnotations } from 'storybook-solidjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import type { Component } from 'solid-js';
import projectAnnotations from '../../../../../.storybook/preview';
import * as stories from '../tab-nav.stories';

const annotations = setProjectAnnotations([projectAnnotations]);

// `composeStories` from `storybook/preview-api` is typed against a generic
// renderer; the Solid Vite framework doesn't ship its own typed wrapper.
// Cast back to renderable Solid components.
const { TabNav } = composeStories(stories as never, annotations) as unknown as {
  TabNav: Component;
};

describe('TabNav', () => {
  it('keyboard navigation: arrow keys, Home/End, no looping', async () => {
    const { container } = render(() => <TabNav />);
    const canvas = within(container);
    const home = canvas.getByTestId('tab-nav-home');
    const projects = canvas.getByTestId('tab-nav-projects');
    const team = canvas.getByTestId('tab-nav-team');
    const settings = canvas.getByTestId('tab-nav-settings');

    home.focus();
    await expect(home).toHaveFocus();

    await userEvent.keyboard('{ArrowRight}');
    await expect(projects).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    await expect(team).toHaveFocus();

    await userEvent.keyboard('{End}');
    await expect(settings).toHaveFocus();

    // No loop: ArrowRight at the end stays put.
    await userEvent.keyboard('{ArrowRight}');
    await expect(settings).toHaveFocus();

    await userEvent.keyboard('{ArrowLeft}');
    await expect(team).toHaveFocus();

    await userEvent.keyboard('{ArrowUp}');
    await expect(projects).toHaveFocus();

    await userEvent.keyboard('{Home}');
    await expect(home).toHaveFocus();

    // No loop: ArrowLeft at the start stays put.
    await userEvent.keyboard('{ArrowLeft}');
    await expect(home).toHaveFocus();
  });
});
