import { createSignal, untrack } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from '../tabs';

const Harness = (overrides: {
  prefix?: string;
  initialValue?: string;
  activationMode?: 'automatic' | 'manual';
  loop?: boolean;
  disabledValue?: string;
  onValueChange?: (value: string) => void;
}) => {
  const prefix = untrack(() => overrides.prefix ?? 'tabs');
  const [value, setValue] = createSignal(
    untrack(() => overrides.initialValue ?? 'one'),
  );
  return (
    <TabsRoot
      testId={`${prefix}-root`}
      value={value()}
      onValueChange={(next) => {
        overrides.onValueChange?.(next);
        setValue(next);
      }}
      activationMode={overrides.activationMode}
    >
      <TabsList testId={`${prefix}-list`} loop={overrides.loop}>
        <TabsTrigger testId={`${prefix}-trigger-one`} value="one">
          One
        </TabsTrigger>
        <TabsTrigger
          testId={`${prefix}-trigger-two`}
          value="two"
          disabled={overrides.disabledValue === 'two'}
        >
          Two
        </TabsTrigger>
        <TabsTrigger
          testId={`${prefix}-trigger-three`}
          value="three"
          disabled={overrides.disabledValue === 'three'}
        >
          Three
        </TabsTrigger>
      </TabsList>
      <TabsContent testId={`${prefix}-content-one`} value="one">
        Panel one
      </TabsContent>
      <TabsContent testId={`${prefix}-content-two`} value="two">
        Panel two
      </TabsContent>
      <TabsContent testId={`${prefix}-content-three`} value="three">
        Panel three
      </TabsContent>
    </TabsRoot>
  );
};

describe('Tabs', () => {
  it('renders the active panel visible and others mounted but hidden', () => {
    render(() => <Harness initialValue="two" />);

    const active = screen.getByTestId('tabs-content-two');
    const inactiveOne = screen.getByTestId('tabs-content-one');
    const inactiveThree = screen.getByTestId('tabs-content-three');

    expect(active).toBeVisible();
    expect(active).toHaveTextContent('Panel two');
    expect(inactiveOne).not.toBeVisible();
    expect(inactiveOne).toBeEmptyDOMElement();
    expect(inactiveThree).not.toBeVisible();
    expect(inactiveThree).toBeEmptyDOMElement();
  });

  it('keeps every trigger pointing at a panel that exists in the DOM', () => {
    render(() => <Harness initialValue="one" />);

    for (const value of ['one', 'two', 'three']) {
      const trigger = screen.getByTestId(`tabs-trigger-${value}`);
      const panelId = trigger.getAttribute('aria-controls');
      expect(panelId).toBeTruthy();
      expect(document.getElementById(panelId!)).not.toBeNull();
    }
  });

  it('wires aria-controls / aria-labelledby between trigger and panel', () => {
    render(() => <Harness initialValue="one" />);

    const trigger = screen.getByTestId('tabs-trigger-one');
    const panel = screen.getByTestId('tabs-content-one');

    expect(trigger).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveAttribute('aria-labelledby', trigger.id);
  });

  it('mints unique ids per <TabsRoot> instance', () => {
    render(() => (
      <>
        <Harness prefix="a" initialValue="one" />
        <Harness prefix="b" initialValue="one" />
      </>
    ));

    const triggerA = screen.getByTestId('a-trigger-one');
    const triggerB = screen.getByTestId('b-trigger-one');
    expect(triggerA.id).not.toBe(triggerB.id);
  });

  it('fires onValueChange when a trigger is clicked', async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    render(() => <Harness onValueChange={handler} />);

    await user.click(screen.getByTestId('tabs-trigger-two'));

    expect(handler).toHaveBeenCalledWith('two');
  });

  it('moves focus and activates next trigger on ArrowRight (automatic)', async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    render(() => <Harness onValueChange={handler} />);

    screen.getByTestId('tabs-trigger-one').focus();
    await user.keyboard('{ArrowRight}');

    expect(screen.getByTestId('tabs-trigger-two')).toHaveFocus();
    expect(handler).toHaveBeenLastCalledWith('two');
  });

  it('moves focus only (no activation) on ArrowRight in manual mode', async () => {
    const handler = vi.fn();
    const user = userEvent.setup();
    render(() => <Harness onValueChange={handler} activationMode="manual" />);

    screen.getByTestId('tabs-trigger-one').focus();
    await user.keyboard('{ArrowRight}');

    expect(screen.getByTestId('tabs-trigger-two')).toHaveFocus();
    expect(handler).not.toHaveBeenCalled();

    await user.keyboard(' ');
    expect(handler).toHaveBeenCalledWith('two');
  });

  it('jumps to first/last enabled trigger on Home/End', async () => {
    const user = userEvent.setup();
    render(() => <Harness initialValue="two" />);

    screen.getByTestId('tabs-trigger-two').focus();

    await user.keyboard('{End}');
    expect(screen.getByTestId('tabs-trigger-three')).toHaveFocus();

    await user.keyboard('{Home}');
    expect(screen.getByTestId('tabs-trigger-one')).toHaveFocus();
  });

  it('treats PageUp/PageDown like Home/End', async () => {
    const user = userEvent.setup();
    render(() => <Harness initialValue="two" />);

    screen.getByTestId('tabs-trigger-two').focus();

    await user.keyboard('{PageDown}');
    expect(screen.getByTestId('tabs-trigger-three')).toHaveFocus();

    await user.keyboard('{PageUp}');
    expect(screen.getByTestId('tabs-trigger-one')).toHaveFocus();
  });

  it('skips disabled triggers during keyboard nav', async () => {
    const user = userEvent.setup();
    render(() => <Harness initialValue="one" disabledValue="two" />);

    screen.getByTestId('tabs-trigger-one').focus();
    await user.keyboard('{ArrowRight}');

    expect(screen.getByTestId('tabs-trigger-three')).toHaveFocus();
  });

  it('wraps when loop=true and stops at the end when loop=false', async () => {
    const user = userEvent.setup();
    const looping = render(() => <Harness initialValue="three" />);
    screen.getByTestId('tabs-trigger-three').focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByTestId('tabs-trigger-one')).toHaveFocus();
    looping.unmount();

    render(() => <Harness prefix="noloop" initialValue="three" loop={false} />);
    const last = screen.getByTestId('noloop-trigger-three');
    last.focus();
    await user.keyboard('{ArrowRight}');
    expect(last).toHaveFocus();
  });

  it('roving tabindex follows the active value', () => {
    render(() => <Harness initialValue="two" />);

    expect(screen.getByTestId('tabs-trigger-one')).toHaveAttribute(
      'tabindex',
      '-1',
    );
    expect(screen.getByTestId('tabs-trigger-two')).toHaveAttribute(
      'tabindex',
      '0',
    );
    expect(screen.getByTestId('tabs-trigger-three')).toHaveAttribute(
      'tabindex',
      '-1',
    );
  });

  it('does not move DOM focus when the consumer changes value externally', () => {
    const [value, setValue] = createSignal('one');
    render(() => (
      <TabsRoot testId="root" value={value()} onValueChange={setValue}>
        <TabsList testId="list">
          <TabsTrigger testId="trigger-one" value="one">
            One
          </TabsTrigger>
          <TabsTrigger testId="trigger-two" value="two">
            Two
          </TabsTrigger>
        </TabsList>
        <TabsContent testId="content-one" value="one">
          Panel one
        </TabsContent>
        <TabsContent testId="content-two" value="two">
          Panel two
        </TabsContent>
      </TabsRoot>
    ));

    const first = screen.getByTestId('trigger-one');
    first.focus();
    setValue('two');

    expect(first).toHaveFocus();
  });

  it('produces valid IDREFs even when the value contains whitespace', () => {
    const [value, setValue] = createSignal('team settings');
    render(() => (
      <TabsRoot testId="root" value={value()} onValueChange={setValue}>
        <TabsList testId="list">
          <TabsTrigger testId="trigger" value="team settings">
            Team Settings
          </TabsTrigger>
        </TabsList>
        <TabsContent testId="content" value="team settings">
          Panel
        </TabsContent>
      </TabsRoot>
    ));

    const trigger = screen.getByTestId('trigger');
    const panel = screen.getByTestId('content');
    expect(trigger.id).not.toContain(' ');
    expect(panel.id).not.toContain(' ');
    expect(trigger).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveAttribute('aria-labelledby', trigger.id);
  });

  it('renders a button with the disabled attribute when disabled', () => {
    render(() => <Harness initialValue="one" disabledValue="two" />);

    expect(screen.getByTestId('tabs-trigger-two')).toBeDisabled();
  });

  it('does not activate on right-click', () => {
    const handler = vi.fn();
    render(() => <Harness onValueChange={handler} />);

    const trigger = screen.getByTestId('tabs-trigger-two');
    trigger.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, button: 2 }),
    );

    expect(handler).not.toHaveBeenCalled();
  });

  it('does not activate on ctrl+click (macOS context menu)', () => {
    const handler = vi.fn();
    render(() => <Harness onValueChange={handler} />);

    const trigger = screen.getByTestId('tabs-trigger-two');
    trigger.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, button: 0, ctrlKey: true }),
    );

    expect(handler).not.toHaveBeenCalled();
  });

  it('passes consumer-supplied event handlers and HTML attributes through', async () => {
    const onMouseDown = vi.fn();
    const user = userEvent.setup();
    render(() => (
      <TabsRoot testId="root" value="one" onValueChange={() => {}}>
        <TabsList testId="list">
          <TabsTrigger
            testId="trigger-one"
            value="one"
            data-custom="hello"
            onMouseDown={onMouseDown}
          >
            One
          </TabsTrigger>
        </TabsList>
        <TabsContent testId="content-one" value="one">
          Panel
        </TabsContent>
      </TabsRoot>
    ));

    const trigger = screen.getByTestId('trigger-one');
    expect(trigger).toHaveAttribute('data-custom', 'hello');

    await user.click(trigger);
    expect(onMouseDown).toHaveBeenCalled();
  });
});
