/**
 * Tests for SegmentedControl. Runs in a real browser via
 * `@vitest/browser` because the indicator's position is pure CSS —
 * `:has()` probes and generated `nth-of-type` ladders that jsdom can't
 * resolve — and because native radio arrow-key navigation only behaves
 * correctly in a real engine.
 */

import { render, screen } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { userEvent } from 'vitest/browser';
import {
  SegmentedControlItem,
  SegmentedControlRoot,
} from '../segmented-control';

const noop = () => {};

/** The decorative chip. Not exposed to consumers, so reach for it by role. */
const indicatorOf = (group: HTMLElement): HTMLElement => {
  const chip = group.querySelector<HTMLElement>('[aria-hidden="true"]');
  if (!chip) throw new Error('indicator not found');
  return chip;
};

/**
 * The visible `<label>` wrapping an item's input. The input itself is
 * clipped to a 1px box, so it's never a valid click target — and its
 * text can't be matched directly either, since the label renders two
 * copies of the children for the cross-fade.
 */
const segmentOf = (testId: string): HTMLElement => {
  const segment = screen.getByTestId(testId).parentElement;
  if (!segment) throw new Error(`segment not found: ${testId}`);
  return segment;
};

describe('SegmentedControl', () => {
  // --- DOM shape ---

  it('renders a <div role="radiogroup">', () => {
    render(() => (
      <SegmentedControlRoot
        testId="group"
        name="view"
        value={null}
        onValueChange={noop}
      />
    ));
    const group = screen.getByTestId('group');
    expect(group.tagName).toBe('DIV');
    expect(group).toHaveAttribute('role', 'radiogroup');
    expect(group).toHaveAttribute('aria-orientation', 'horizontal');
  });

  it('wraps each item in a <label> with the input as a child', () => {
    render(() => (
      <SegmentedControlRoot
        testId="group"
        name="view"
        value={null}
        onValueChange={noop}
      >
        <SegmentedControlItem testId="list" value="list">
          List
        </SegmentedControlItem>
      </SegmentedControlRoot>
    ));
    const input = screen.getByTestId('list');
    expect(input.tagName).toBe('INPUT');
    expect(input).toHaveAttribute('type', 'radio');
    expect(input.parentElement?.tagName).toBe('LABEL');
  });

  it('names the radio from the visible copy only', () => {
    render(() => (
      <SegmentedControlRoot
        testId="group"
        name="view"
        value={null}
        onValueChange={noop}
      >
        <SegmentedControlItem testId="list" value="list">
          List
        </SegmentedControlItem>
      </SegmentedControlRoot>
    ));
    // The label renders its children twice to cross-fade between
    // weights; the duplicate is `aria-hidden`, so the accessible name
    // must not read "List List".
    expect(screen.getByRole('radio', { name: 'List' })).toBe(
      screen.getByTestId('list'),
    );
  });

  // --- Group wiring ---

  it('forwards `name` to every item', () => {
    render(() => (
      <SegmentedControlRoot
        testId="group"
        name="view"
        value={null}
        onValueChange={noop}
      >
        <SegmentedControlItem testId="a" value="a" />
        <SegmentedControlItem testId="b" value="b" />
      </SegmentedControlRoot>
    ));
    expect(screen.getByTestId('a')).toHaveAttribute('name', 'view');
    expect(screen.getByTestId('b')).toHaveAttribute('name', 'view');
  });

  it('checks only the item whose value matches the group value', () => {
    render(() => (
      <SegmentedControlRoot
        testId="group"
        name="view"
        value="b"
        onValueChange={noop}
      >
        <SegmentedControlItem testId="a" value="a" />
        <SegmentedControlItem testId="b" value="b" />
        <SegmentedControlItem testId="c" value="c" />
      </SegmentedControlRoot>
    ));
    expect(screen.getByTestId('a')).not.toBeChecked();
    expect(screen.getByTestId('b')).toBeChecked();
    expect(screen.getByTestId('c')).not.toBeChecked();
  });

  it('renders nothing checked when value is null', () => {
    render(() => (
      <SegmentedControlRoot
        testId="group"
        name="view"
        value={null}
        onValueChange={noop}
      >
        <SegmentedControlItem testId="a" value="a" />
        <SegmentedControlItem testId="b" value="b" />
      </SegmentedControlRoot>
    ));
    expect(screen.getByTestId('a')).not.toBeChecked();
    expect(screen.getByTestId('b')).not.toBeChecked();
  });

  it('throws when an item renders outside a root', () => {
    expect(() =>
      render(() => <SegmentedControlItem testId="a" value="a" />),
    ).toThrow(/outside of <SegmentedControlRoot>/);
  });

  // --- Selection ---

  it('fires onValueChange when the user clicks a segment', async () => {
    const handler = vi.fn();
    render(() => (
      <SegmentedControlRoot
        testId="group"
        name="view"
        value="a"
        onValueChange={handler}
      >
        <SegmentedControlItem testId="a" value="a">
          Alpha
        </SegmentedControlItem>
        <SegmentedControlItem testId="b" value="b">
          Beta
        </SegmentedControlItem>
      </SegmentedControlRoot>
    ));

    // Click the visible segment, not the clipped input — the label
    // proxies the click.
    await userEvent.click(segmentOf('b'));
    expect(handler).toHaveBeenCalledWith('b');
  });

  it('reflects the new value through the group prop', async () => {
    const Harness = () => {
      const [value, setValue] = createSignal<string | null>('a');
      return (
        <SegmentedControlRoot
          testId="group"
          name="view"
          value={value()}
          onValueChange={setValue}
        >
          <SegmentedControlItem testId="a" value="a">
            Alpha
          </SegmentedControlItem>
          <SegmentedControlItem testId="b" value="b">
            Beta
          </SegmentedControlItem>
        </SegmentedControlRoot>
      );
    };
    render(() => <Harness />);

    await userEvent.click(segmentOf('b'));
    expect(screen.getByTestId('b')).toBeChecked();
    expect(screen.getByTestId('a')).not.toBeChecked();
  });

  it('reverts the visual state when the parent ignores the change', async () => {
    render(() => (
      <SegmentedControlRoot
        testId="group"
        name="view"
        value="a"
        onValueChange={noop}
      >
        <SegmentedControlItem testId="a" value="a">
          Alpha
        </SegmentedControlItem>
        <SegmentedControlItem testId="b" value="b">
          Beta
        </SegmentedControlItem>
      </SegmentedControlRoot>
    ));

    await userEvent.click(segmentOf('b'));
    expect(screen.getByTestId('a')).toBeChecked();
    expect(screen.getByTestId('b')).not.toBeChecked();
  });

  // --- Indicator ---

  it('hides the indicator until something is checked', () => {
    render(() => (
      <SegmentedControlRoot
        testId="group"
        name="view"
        value={null}
        onValueChange={noop}
      >
        <SegmentedControlItem testId="a" value="a">
          Alpha
        </SegmentedControlItem>
        <SegmentedControlItem testId="b" value="b">
          Beta
        </SegmentedControlItem>
      </SegmentedControlRoot>
    ));
    const chip = indicatorOf(screen.getByTestId('group'));
    expect(getComputedStyle(chip).display).toBe('none');
  });

  it('sizes the indicator to one column and slides it to the checked one', () => {
    const Harness = () => {
      const [value, setValue] = createSignal<string | null>('a');
      return (
        <>
          <SegmentedControlRoot
            testId="group"
            name="view"
            value={value()}
            onValueChange={setValue}
          >
            <SegmentedControlItem testId="a" value="a">
              Alpha
            </SegmentedControlItem>
            <SegmentedControlItem testId="b" value="b">
              Beta
            </SegmentedControlItem>
            <SegmentedControlItem testId="c" value="c">
              Gamma
            </SegmentedControlItem>
          </SegmentedControlRoot>
          <button type="button" onClick={() => setValue('c')}>
            Pick Gamma
          </button>
        </>
      );
    };
    render(() => <Harness />);

    const group = screen.getByTestId('group');
    const chip = indicatorOf(group);
    const column = group.getBoundingClientRect().width / 3;

    expect(chip.getBoundingClientRect().width).toBeCloseTo(column, 0);
    expect(getComputedStyle(chip).display).toBe('block');
    // Resting at the first column.
    expect(chip.getBoundingClientRect().left).toBeCloseTo(
      group.getBoundingClientRect().left,
      0,
    );
  });

  it('offsets the indicator by the checked column', () => {
    render(() => (
      <SegmentedControlRoot
        testId="group"
        name="view"
        value="c"
        onValueChange={noop}
      >
        <SegmentedControlItem testId="a" value="a">
          Alpha
        </SegmentedControlItem>
        <SegmentedControlItem testId="b" value="b">
          Beta
        </SegmentedControlItem>
        <SegmentedControlItem testId="c" value="c">
          Gamma
        </SegmentedControlItem>
      </SegmentedControlRoot>
    ));

    const group = screen.getByTestId('group');
    const chip = indicatorOf(group);
    const groupBox = group.getBoundingClientRect();
    const column = groupBox.width / 3;

    expect(chip.getBoundingClientRect().left).toBeCloseTo(
      groupBox.left + column * 2,
      0,
    );
  });

  it('keeps the indicator over the checked segment', () => {
    render(() => (
      <SegmentedControlRoot
        testId="group"
        name="view"
        value="b"
        onValueChange={noop}
      >
        <SegmentedControlItem testId="a" value="a">
          Alpha
        </SegmentedControlItem>
        <SegmentedControlItem testId="b" value="b">
          Beta
        </SegmentedControlItem>
      </SegmentedControlRoot>
    ));

    const group = screen.getByTestId('group');
    const chip = indicatorOf(group);
    const segment = screen.getByTestId('b').parentElement;
    expect(segment).not.toBeNull();
    expect(chip.getBoundingClientRect().left).toBeCloseTo(
      segment!.getBoundingClientRect().left,
      0,
    );
  });

  it('paints the indicator beneath the segment labels', () => {
    render(() => (
      <SegmentedControlRoot
        testId="group"
        name="view"
        value="a"
        onValueChange={noop}
      >
        <SegmentedControlItem testId="a" value="a">
          Alpha
        </SegmentedControlItem>
        <SegmentedControlItem testId="b" value="b">
          Beta
        </SegmentedControlItem>
      </SegmentedControlRoot>
    ));

    // The layering is built out of paint order rather than z-index, so
    // guard it with a hit test: the point at the middle of the checked
    // segment must resolve to its label, not the chip.
    const label = screen.getByTestId('a').parentElement!;
    const box = label.getBoundingClientRect();
    const hit = document.elementFromPoint(
      box.left + box.width / 2,
      box.top + box.height / 2,
    );
    expect(label.contains(hit)).toBe(true);
  });

  // --- Disabled ---

  it('disables every item when the group is disabled', () => {
    render(() => (
      <SegmentedControlRoot
        testId="group"
        name="view"
        disabled
        value="a"
        onValueChange={noop}
      >
        <SegmentedControlItem testId="a" value="a" />
        <SegmentedControlItem testId="b" value="b" />
      </SegmentedControlRoot>
    ));
    expect(screen.getByTestId('a')).toBeDisabled();
    expect(screen.getByTestId('b')).toBeDisabled();
    expect(screen.getByTestId('group')).toHaveAttribute('data-disabled', '');
  });

  it('omits data-disabled when enabled', () => {
    render(() => (
      <SegmentedControlRoot
        testId="group"
        name="view"
        value={null}
        onValueChange={noop}
      />
    ));
    expect(screen.getByTestId('group')).not.toHaveAttribute('data-disabled');
  });

  it('lets a single segment be disabled while others stay enabled', () => {
    render(() => (
      <SegmentedControlRoot
        testId="group"
        name="view"
        value="a"
        onValueChange={noop}
      >
        <SegmentedControlItem testId="a" value="a" />
        <SegmentedControlItem testId="b" value="b" disabled />
      </SegmentedControlRoot>
    ));
    expect(screen.getByTestId('a')).not.toBeDisabled();
    expect(screen.getByTestId('b')).toBeDisabled();
  });

  // --- Required ---

  it('propagates `required` to the group and its items', () => {
    render(() => (
      <SegmentedControlRoot
        testId="group"
        name="view"
        required
        value={null}
        onValueChange={noop}
      >
        <SegmentedControlItem testId="a" value="a" />
        <SegmentedControlItem testId="b" value="b" required={false} />
      </SegmentedControlRoot>
    ));
    expect(screen.getByTestId('group')).toHaveAttribute(
      'aria-required',
      'true',
    );
    expect(screen.getByTestId('a')).toBeRequired();
    expect(screen.getByTestId('b')).not.toBeRequired();
  });

  // --- Keyboard ---

  it('moves the selection with arrow keys', async () => {
    const Harness = () => {
      const [value, setValue] = createSignal<string | null>('a');
      return (
        <SegmentedControlRoot
          testId="group"
          name="view"
          value={value()}
          onValueChange={setValue}
        >
          <SegmentedControlItem testId="a" value="a">
            Alpha
          </SegmentedControlItem>
          <SegmentedControlItem testId="b" value="b">
            Beta
          </SegmentedControlItem>
        </SegmentedControlRoot>
      );
    };
    render(() => <Harness />);

    screen.getByTestId('a').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByTestId('b')).toBeChecked();
    expect(screen.getByTestId('a')).not.toBeChecked();
  });

  it('skips disabled segments during arrow navigation', async () => {
    const Harness = () => {
      const [value, setValue] = createSignal<string | null>('a');
      return (
        <SegmentedControlRoot
          testId="group"
          name="view"
          value={value()}
          onValueChange={setValue}
        >
          <SegmentedControlItem testId="a" value="a">
            Alpha
          </SegmentedControlItem>
          <SegmentedControlItem testId="b" value="b" disabled>
            Beta
          </SegmentedControlItem>
          <SegmentedControlItem testId="c" value="c">
            Gamma
          </SegmentedControlItem>
        </SegmentedControlRoot>
      );
    };
    render(() => <Harness />);

    screen.getByTestId('a').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByTestId('c')).toBeChecked();
  });

  it('does not submit a wrapping form when Enter is pressed', async () => {
    const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
    render(() => (
      <form data-testid="form" onSubmit={onSubmit}>
        <SegmentedControlRoot
          testId="group"
          name="view"
          value="a"
          onValueChange={noop}
        >
          <SegmentedControlItem testId="a" value="a" />
          <SegmentedControlItem testId="b" value="b" />
        </SegmentedControlRoot>
        <button type="submit">Go</button>
      </form>
    ));

    screen.getByTestId('a').focus();
    await userEvent.keyboard('{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // --- Form integration ---

  it('submits the checked value under the group name', () => {
    render(() => (
      <form data-testid="form">
        <SegmentedControlRoot
          testId="group"
          name="view"
          value="table"
          onValueChange={noop}
        >
          <SegmentedControlItem testId="list" value="list" />
          <SegmentedControlItem testId="table" value="table" />
        </SegmentedControlRoot>
      </form>
    ));
    const form = screen.getByTestId<HTMLFormElement>('form');
    expect(new FormData(form).get('view')).toBe('table');
  });

  it('does not clobber a same-name group in a sibling form', async () => {
    render(() => (
      <>
        <form data-testid="form-one">
          <SegmentedControlRoot
            testId="group-one"
            name="view"
            value="list"
            onValueChange={noop}
          >
            <SegmentedControlItem testId="one-list" value="list">
              List
            </SegmentedControlItem>
            <SegmentedControlItem testId="one-table" value="table">
              Table
            </SegmentedControlItem>
          </SegmentedControlRoot>
        </form>
        <form data-testid="form-two">
          <SegmentedControlRoot
            testId="group-two"
            name="view"
            value="table"
            onValueChange={noop}
          >
            <SegmentedControlItem testId="two-list" value="list">
              List
            </SegmentedControlItem>
            <SegmentedControlItem testId="two-table" value="table">
              Table
            </SegmentedControlItem>
          </SegmentedControlRoot>
        </form>
      </>
    ));

    // Reconciliation must scope to group one and leave group two alone.
    await userEvent.click(segmentOf('one-table'));
    expect(screen.getByTestId('two-table')).toBeChecked();
    expect(screen.getByTestId('two-list')).not.toBeChecked();
  });
});
