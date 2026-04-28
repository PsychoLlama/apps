import { expect, screen, userEvent } from 'storybook/test';
import { composeStories } from '../../../../compose-stories';
import * as stories from '../tab-nav.stories';

const { TabNav } = composeStories(stories);

describe('TabNav', () => {
  it('ArrowRight and ArrowDown move focus forward', async () => {
    await TabNav.run();
    const home = screen.getByTestId('tab-nav-home');
    const projects = screen.getByTestId('tab-nav-projects');
    const team = screen.getByTestId('tab-nav-team');

    home.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(projects).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    await expect(team).toHaveFocus();
  });

  it('ArrowLeft and ArrowUp move focus backward', async () => {
    await TabNav.run();
    const projects = screen.getByTestId('tab-nav-projects');
    const team = screen.getByTestId('tab-nav-team');
    const settings = screen.getByTestId('tab-nav-settings');

    settings.focus();
    await userEvent.keyboard('{ArrowLeft}');
    await expect(team).toHaveFocus();

    await userEvent.keyboard('{ArrowUp}');
    await expect(projects).toHaveFocus();
  });

  it('Home jumps to the first link', async () => {
    await TabNav.run();
    const home = screen.getByTestId('tab-nav-home');
    const settings = screen.getByTestId('tab-nav-settings');

    settings.focus();
    await userEvent.keyboard('{Home}');
    await expect(home).toHaveFocus();
  });

  it('End jumps to the last link', async () => {
    await TabNav.run();
    const home = screen.getByTestId('tab-nav-home');
    const settings = screen.getByTestId('tab-nav-settings');

    home.focus();
    await userEvent.keyboard('{End}');
    await expect(settings).toHaveFocus();
  });

  it('ArrowRight at the last link stays put — no looping', async () => {
    await TabNav.run();
    const settings = screen.getByTestId('tab-nav-settings');

    settings.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(settings).toHaveFocus();
  });

  it('ArrowLeft at the first link stays put — no looping', async () => {
    await TabNav.run();
    const home = screen.getByTestId('tab-nav-home');

    home.focus();
    await userEvent.keyboard('{ArrowLeft}');
    await expect(home).toHaveFocus();
  });
});
