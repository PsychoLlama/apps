import { render, screen } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { userEvent } from 'vitest/browser';
import Slider from '../slider';

const noop = () => {};

const Controlled = (props: {
  initial?: number[];
  min?: number;
  max?: number;
  step?: number;
  onCommit?: (v: number[]) => void;
  disabled?: boolean;
}) => {
  const [value, setValue] = createSignal(props.initial ?? [50]);
  return (
    <Slider
      testId="sl"
      value={value()}
      onValueChange={setValue}
      onValueCommit={props.onCommit}
      min={props.min}
      max={props.max}
      step={props.step}
      disabled={props.disabled}
    />
  );
};

describe('Slider', () => {
  // --- DOM shape ---

  it('renders one thumb per value', () => {
    render(() => <Slider testId="sl" value={[25, 75]} onValueChange={noop} />);
    expect(screen.getAllByRole('slider')).toHaveLength(2);
  });

  it('forwards native span attributes to the root', () => {
    render(() => (
      <Slider
        testId="sl"
        id="vol"
        aria-label="Volume"
        aria-describedby="vol-desc"
        value={[50]}
        onValueChange={noop}
      />
    ));
    const root = screen.getByTestId('sl');
    expect(root).toHaveAttribute('id', 'vol');
    expect(root).toHaveAttribute('aria-label', 'Volume');
    expect(root).toHaveAttribute('aria-describedby', 'vol-desc');
  });

  it('exposes ARIA range attributes on each thumb', () => {
    render(() => (
      <Slider testId="sl" min={0} max={200} value={[40]} onValueChange={noop} />
    ));
    const thumb = screen.getByRole('slider');
    expect(thumb).toHaveAttribute('aria-valuemin', '0');
    expect(thumb).toHaveAttribute('aria-valuemax', '200');
    expect(thumb).toHaveAttribute('aria-valuenow', '40');
    expect(thumb).toHaveAttribute('aria-orientation', 'horizontal');
  });

  it('labels two-thumb sliders Minimum/Maximum', () => {
    render(() => <Slider testId="sl" value={[10, 90]} onValueChange={noop} />);
    const thumbs = screen.getAllByRole('slider');
    expect(thumbs[0]).toHaveAttribute('aria-label', 'Minimum');
    expect(thumbs[1]).toHaveAttribute('aria-label', 'Maximum');
  });

  it('numbers thumbs in 3+ thumb sliders', () => {
    render(() => (
      <Slider testId="sl" value={[10, 50, 90]} onValueChange={noop} />
    ));
    const thumbs = screen.getAllByRole('slider');
    expect(thumbs[0]).toHaveAttribute('aria-label', 'Value 1 of 3');
    expect(thumbs[2]).toHaveAttribute('aria-label', 'Value 3 of 3');
  });

  // --- Keyboard ---

  it('moves the value by step on ArrowRight', async () => {
    const onCommit = vi.fn();
    render(() => <Controlled initial={[50]} onCommit={onCommit} />);
    const thumb = screen.getByRole('slider');
    thumb.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(thumb).toHaveAttribute('aria-valuenow', '51');
    expect(onCommit).toHaveBeenCalledWith([51]);
  });

  it('moves backward on ArrowLeft', async () => {
    render(() => <Controlled initial={[50]} />);
    const thumb = screen.getByRole('slider');
    thumb.focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(thumb).toHaveAttribute('aria-valuenow', '49');
  });

  it('jumps by 10×step on Shift+Arrow', async () => {
    render(() => <Controlled initial={[50]} />);
    const thumb = screen.getByRole('slider');
    thumb.focus();
    await userEvent.keyboard('{Shift>}{ArrowRight}{/Shift}');
    expect(thumb).toHaveAttribute('aria-valuenow', '60');
  });

  it('jumps by 10×step on PageUp/PageDown', async () => {
    render(() => <Controlled initial={[50]} />);
    const thumb = screen.getByRole('slider');
    thumb.focus();
    await userEvent.keyboard('{PageUp}');
    expect(thumb).toHaveAttribute('aria-valuenow', '60');
    await userEvent.keyboard('{PageDown}');
    expect(thumb).toHaveAttribute('aria-valuenow', '50');
  });

  it('clamps to min on Home', async () => {
    render(() => <Controlled initial={[50]} min={0} max={100} />);
    const thumb = screen.getByRole('slider');
    thumb.focus();
    await userEvent.keyboard('{Home}');
    expect(thumb).toHaveAttribute('aria-valuenow', '0');
  });

  it('clamps to max on End', async () => {
    render(() => <Controlled initial={[50]} min={0} max={100} />);
    const thumb = screen.getByRole('slider');
    thumb.focus();
    await userEvent.keyboard('{End}');
    expect(thumb).toHaveAttribute('aria-valuenow', '100');
  });

  it('Home/End operate on the focused thumb (multi-thumb)', async () => {
    let last: number[] = [];
    const Multi = () => {
      const [value, setValue] = createSignal([20, 80]);
      return (
        <Slider
          testId="sl"
          value={value()}
          onValueChange={(next) => {
            last = next;
            setValue(next);
          }}
        />
      );
    };
    render(() => <Multi />);
    const [, high] = screen.getAllByRole('slider');
    high.focus();
    await userEvent.keyboard('{Home}');
    // High (80) was focused; Home moves it to min, then sort gives
    // [0, 20]. Radix's hardcoded `index = 0` would have left high at
    // 80 and moved low to 0 — we follow the W3C pattern instead.
    expect(last).toEqual([0, 20]);
  });

  it('respects custom step', async () => {
    render(() => <Controlled initial={[50]} step={5} />);
    const thumb = screen.getByRole('slider');
    thumb.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(thumb).toHaveAttribute('aria-valuenow', '55');
  });

  it('does not move past max', async () => {
    render(() => <Controlled initial={[100]} min={0} max={100} />);
    const thumb = screen.getByRole('slider');
    thumb.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(thumb).toHaveAttribute('aria-valuenow', '100');
  });

  it('reverses keyboard direction when inverted', async () => {
    render(() => (
      <Slider testId="sl" inverted value={[50]} onValueChange={() => {}} />
    ));
    // ArrowRight should now move backward — confirm via onValueChange.
    const handler = vi.fn();
    render(() => (
      <Slider testId="sl-2" inverted value={[50]} onValueChange={handler} />
    ));
    const thumb = screen.getAllByRole('slider').at(-1)!;
    thumb.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(handler).toHaveBeenCalledWith([49]);
  });

  // --- Disabled ---

  it('does not respond to keyboard when disabled', async () => {
    const handler = vi.fn();
    render(() => (
      <Slider testId="sl" disabled value={[50]} onValueChange={handler} />
    ));
    const thumb = screen.getByRole('slider');
    expect(thumb).toHaveAttribute('tabindex', '-1');
    expect(thumb).toHaveAttribute('aria-disabled', 'true');
    await userEvent.keyboard('{ArrowRight}');
    expect(handler).not.toHaveBeenCalled();
  });

  it('marks the root aria-disabled when disabled', () => {
    render(() => (
      <Slider testId="sl" disabled value={[50]} onValueChange={noop} />
    ));
    expect(screen.getByTestId('sl')).toHaveAttribute('aria-disabled', 'true');
  });

  // --- Range / multi-thumb ---

  it('keeps thumbs sorted when one crosses another', async () => {
    let last: number[] = [];
    const Multi = () => {
      const [value, setValue] = createSignal([40, 60]);
      return (
        <Slider
          testId="sl"
          value={value()}
          onValueChange={(next) => {
            last = next;
            setValue(next);
          }}
        />
      );
    };
    render(() => <Multi />);
    const [low] = screen.getAllByRole('slider');
    low.focus();
    // Drag low past high via shift+arrow (10 per tap).
    await userEvent.keyboard(
      '{Shift>}{ArrowRight}{ArrowRight}{ArrowRight}{/Shift}',
    );
    expect(last).toEqual([60, 70]);
    const after = screen.getAllByRole('slider');
    expect(after[0]).toHaveAttribute('aria-valuenow', '60');
    expect(after[1]).toHaveAttribute('aria-valuenow', '70');
  });

  it('honors minStepsBetweenThumbs', async () => {
    const handler = vi.fn();
    const Multi = () => {
      const [value, setValue] = createSignal([40, 60]);
      return (
        <Slider
          testId="sl"
          value={value()}
          minStepsBetweenThumbs={16}
          onValueChange={(next) => {
            handler(next);
            setValue(next);
          }}
        />
      );
    };
    render(() => <Multi />);
    const [, high] = screen.getAllByRole('slider');
    high.focus();
    // Initial gap is 20. Each ArrowLeft narrows it by 1; the rule
    // requires ≥16 between thumbs, so the 5th move (gap → 15) is
    // rejected.
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}');
    expect(handler).toHaveBeenLastCalledWith([40, 56]);
    await userEvent.keyboard('{ArrowLeft}');
    expect(handler).toHaveBeenLastCalledWith([40, 56]);
  });

  // --- Form integration ---

  it('does not render hidden inputs without a name', () => {
    render(() => (
      <form data-testid="form">
        <Slider testId="sl" value={[10]} onValueChange={noop} />
      </form>
    ));
    expect(
      screen.getByTestId('form').querySelectorAll('input[type="hidden"]'),
    ).toHaveLength(0);
  });

  it('renders one hidden input with name + value when single-thumb', () => {
    render(() => (
      <form data-testid="form">
        <Slider testId="sl" name="vol" value={[42]} onValueChange={noop} />
      </form>
    ));
    const inputs = screen
      .getByTestId('form')
      .querySelectorAll<HTMLInputElement>('input[type="hidden"]');
    expect(inputs).toHaveLength(1);
    expect(inputs[0]).toHaveAttribute('name', 'vol');
    expect(inputs[0]).toHaveAttribute('value', '42');
  });

  it('appends `[]` to the name for multi-thumb sliders', () => {
    render(() => (
      <form data-testid="form">
        <Slider
          testId="sl"
          name="range"
          value={[10, 90]}
          onValueChange={noop}
        />
      </form>
    ));
    const inputs = screen
      .getByTestId('form')
      .querySelectorAll<HTMLInputElement>('input[type="hidden"]');
    expect(inputs).toHaveLength(2);
    expect(inputs[0]).toHaveAttribute('name', 'range[]');
    expect(inputs[1]).toHaveAttribute('name', 'range[]');
    expect(inputs[0]).toHaveAttribute('value', '10');
    expect(inputs[1]).toHaveAttribute('value', '90');
  });

  it('omits hidden inputs when disabled', () => {
    render(() => (
      <form data-testid="form">
        <Slider
          testId="sl"
          name="vol"
          disabled
          value={[42]}
          onValueChange={noop}
        />
      </form>
    ));
    expect(
      screen.getByTestId('form').querySelectorAll('input[type="hidden"]'),
    ).toHaveLength(0);
  });

  // --- Orientation ---

  it('exposes orientation on the root and thumbs', () => {
    render(() => (
      <Slider
        testId="sl"
        orientation="vertical"
        value={[50]}
        onValueChange={noop}
      />
    ));
    expect(screen.getByTestId('sl')).toHaveAttribute(
      'data-orientation',
      'vertical',
    );
    expect(screen.getByRole('slider')).toHaveAttribute(
      'aria-orientation',
      'vertical',
    );
  });
});
