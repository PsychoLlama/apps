import { createTestController } from '@lib/effects/testing';
import { $itemMenu, $itemMenuToggled } from '../item-menu';

describe('$itemMenu', () => {
  it('starts with no menu open', async () => {
    await using effects = createTestController();

    expect((await effects.run($itemMenu))()).toBeNull();
  });

  it('holds the item whose menu opened until it closes', async () => {
    await using effects = createTestController();
    const itemMenu = await effects.run($itemMenu);
    const toggled = await effects.run($itemMenuToggled);

    toggled('note', true);
    expect(itemMenu()).toBe('note');

    toggled('note', false);
    expect(itemMenu()).toBeNull();
  });

  it('ignores a close from a menu that is no longer the open one', async () => {
    await using effects = createTestController();
    const itemMenu = await effects.run($itemMenu);
    const toggled = await effects.run($itemMenuToggled);

    toggled('note', true);
    toggled('file', true);
    toggled('note', false);

    expect(itemMenu()).toBe('file');
  });
});
