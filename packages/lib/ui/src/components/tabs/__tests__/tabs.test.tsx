import { createSignal } from 'solid-js';
import { render } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from '../tabs';

const Harness = (overrides: {
  initialValue?: string;
  activationMode?: 'automatic' | 'manual';
  loop?: boolean;
  disabledValue?: string;
  onValueChange?: (value: string) => void;
}) => {
  const [value, setValue] = createSignal(overrides.initialValue ?? 'one');
  return (
    <TabsRoot
      value={value()}
      onValueChange={(next) => {
        overrides.onValueChange?.(next);
        setValue(next);
      }}
      activationMode={overrides.activationMode}
      loop={overrides.loop}
    >
      <TabsList>
        <TabsTrigger value="one">One</TabsTrigger>
        <TabsTrigger value="two" disabled={overrides.disabledValue === 'two'}>
          Two
        </TabsTrigger>
        <TabsTrigger
          value="three"
          disabled={overrides.disabledValue === 'three'}
        >
          Three
        </TabsTrigger>
      </TabsList>
      <TabsContent value="one">Panel one</TabsContent>
      <TabsContent value="two">Panel two</TabsContent>
      <TabsContent value="three">Panel three</TabsContent>
    </TabsRoot>
  );
};

const triggers = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLButtonElement>('[role="tab"]'));

describe('Tabs', () => {
  it('renders the active panel and hides the others', () => {
    const { container } = render(() => <Harness initialValue="two" />);

    const panels = container.querySelectorAll('[role="tabpanel"]');
    expect(panels.length).toBe(1);
    expect(panels[0]?.textContent).toBe('Panel two');
  });

  it('wires aria-controls / aria-labelledby between trigger and panel', () => {
    const { container } = render(() => <Harness initialValue="one" />);

    const trigger = container.querySelector<HTMLButtonElement>(
      '[role="tab"][aria-selected="true"]',
    );
    const panel = container.querySelector<HTMLElement>('[role="tabpanel"]');

    expect(trigger?.id).toBeTruthy();
    expect(panel?.id).toBeTruthy();
    expect(trigger?.getAttribute('aria-controls')).toBe(panel?.id);
    expect(panel?.getAttribute('aria-labelledby')).toBe(trigger?.id);
  });

  it('mints unique ids per <TabsRoot> instance', () => {
    const { container } = render(() => (
      <>
        <Harness initialValue="one" />
        <Harness initialValue="one" />
      </>
    ));

    const triggerIds = Array.from(
      container.querySelectorAll<HTMLButtonElement>(
        '[role="tab"][aria-selected="true"]',
      ),
    ).map((el) => el.id);

    expect(triggerIds.length).toBe(2);
    expect(new Set(triggerIds).size).toBe(2);
  });

  it('applies aria-orientation from the orientation prop', () => {
    const { container } = render(() => {
      const [value, setValue] = createSignal('one');
      return (
        <TabsRoot
          value={value()}
          onValueChange={setValue}
          orientation="vertical"
        >
          <TabsList>
            <TabsTrigger value="one">One</TabsTrigger>
          </TabsList>
          <TabsContent value="one">Panel</TabsContent>
        </TabsRoot>
      );
    });

    const list = container.querySelector('[role="tablist"]');
    expect(list?.getAttribute('aria-orientation')).toBe('vertical');
  });

  it('fires onValueChange when a trigger is clicked', async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    const { container } = render(() => <Harness onValueChange={handler} />);

    const [, secondTrigger] = triggers(container);
    if (secondTrigger) await user.click(secondTrigger);

    expect(handler).toHaveBeenCalledWith('two');
  });

  it('moves focus and activates next trigger on ArrowRight (automatic)', async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    const { container } = render(() => <Harness onValueChange={handler} />);

    const [first, second] = triggers(container);
    first?.focus();
    await user.keyboard('{ArrowRight}');

    expect(document.activeElement).toBe(second);
    expect(handler).toHaveBeenLastCalledWith('two');
  });

  it('moves focus only (no activation) on ArrowRight in manual mode', async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    const { container } = render(() => (
      <Harness onValueChange={handler} activationMode="manual" />
    ));

    const [first, second] = triggers(container);
    first?.focus();
    await user.keyboard('{ArrowRight}');

    expect(document.activeElement).toBe(second);
    expect(handler).not.toHaveBeenCalled();

    await user.keyboard(' ');
    expect(handler).toHaveBeenCalledWith('two');
  });

  it('jumps to first/last enabled trigger on Home/End', async () => {
    const user = userEvent.setup();
    const { container } = render(() => <Harness initialValue="two" />);

    const [first, second, third] = triggers(container);
    second?.focus();

    await user.keyboard('{End}');
    expect(document.activeElement).toBe(third);

    await user.keyboard('{Home}');
    expect(document.activeElement).toBe(first);
  });

  it('skips disabled triggers during keyboard nav', async () => {
    const user = userEvent.setup();
    const { container } = render(() => (
      <Harness initialValue="one" disabledValue="two" />
    ));

    const [first, , third] = triggers(container);
    first?.focus();
    await user.keyboard('{ArrowRight}');

    expect(document.activeElement).toBe(third);
  });

  it('wraps when loop=true and stops at the end when loop=false', async () => {
    const user = userEvent.setup();
    const looping = render(() => <Harness initialValue="three" />);
    const loopingTriggers = triggers(looping.container);
    const [first] = loopingTriggers;
    const last = loopingTriggers[loopingTriggers.length - 1];
    last?.focus();
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(first);
    looping.unmount();

    const noLoop = render(() => <Harness initialValue="three" loop={false} />);
    const noLoopTriggers = triggers(noLoop.container);
    const noLoopLast = noLoopTriggers[noLoopTriggers.length - 1];
    noLoopLast?.focus();
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(noLoopLast);
  });

  it('roving tabindex follows the active value', () => {
    const { container } = render(() => <Harness initialValue="two" />);

    const [first, second, third] = triggers(container);
    expect(first?.tabIndex).toBe(-1);
    expect(second?.tabIndex).toBe(0);
    expect(third?.tabIndex).toBe(-1);
  });

  it('does not move DOM focus when the consumer changes value externally', () => {
    const [value, setValue] = createSignal('one');
    const { container } = render(() => (
      <TabsRoot value={value()} onValueChange={setValue}>
        <TabsList>
          <TabsTrigger value="one">One</TabsTrigger>
          <TabsTrigger value="two">Two</TabsTrigger>
        </TabsList>
        <TabsContent value="one">Panel one</TabsContent>
        <TabsContent value="two">Panel two</TabsContent>
      </TabsRoot>
    ));

    const [first] = triggers(container);
    first?.focus();
    setValue('two');

    expect(document.activeElement).toBe(first);
  });

  it('produces valid IDREFs even when the value contains whitespace', () => {
    const [value, setValue] = createSignal('team settings');
    const { container } = render(() => (
      <TabsRoot value={value()} onValueChange={setValue}>
        <TabsList>
          <TabsTrigger value="team settings">Team Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="team settings">Panel</TabsContent>
      </TabsRoot>
    ));

    const trigger = container.querySelector<HTMLButtonElement>('[role="tab"]');
    const panel = container.querySelector<HTMLElement>('[role="tabpanel"]');
    expect(trigger?.id).not.toContain(' ');
    expect(panel?.id).not.toContain(' ');
    expect(trigger?.getAttribute('aria-controls')).toBe(panel?.id);
    expect(panel?.getAttribute('aria-labelledby')).toBe(trigger?.id);
  });

  it('renders a button with the disabled attribute when disabled', () => {
    const { container } = render(() => (
      <Harness initialValue="one" disabledValue="two" />
    ));

    const [, second] = triggers(container);
    expect(second?.disabled).toBe(true);
  });
});
