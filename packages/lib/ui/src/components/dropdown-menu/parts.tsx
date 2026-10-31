/**
 * DropdownMenu parts: the items, groups, labels, and separators a menu's
 * `content` is built from. Deviations are recorded on `DropdownMenu`.
 *
 * @see https://www.radix-ui.com/themes/docs/components/dropdown-menu
 */

import {
  Match,
  Show,
  Switch,
  mergeProps,
  splitProps,
  type JSX,
} from 'solid-js';
import { Dynamic } from 'solid-js/web';
import IconCheck from 'virtual:icons/mdi/check-bold';
import IconChevronDown from 'virtual:icons/mdi/chevron-down';
import IconMinus from 'virtual:icons/mdi/minus-thick';
import clx from '@lib/classnames';
import { useFloatingTag, type FloatingElement } from '../_internal/floating-ui';
import {
  type RequiredTestIdProps,
  type TestIdProps,
} from '../../props/test-id';
import {
  DropdownMenuRadioContext,
  useDropdownMenuContext,
  useDropdownMenuRadioContext,
} from './context';
import { NO_SCROLL } from './navigation';
import * as css from './dropdown-menu.css';

/** Semantic color palette for an item or a menu's highlight. */
export type DropdownMenuColor =
  'accent' | 'neutral' | 'danger' | 'warning' | 'success';

/** Tri-state value of a checkbox item. */
export type DropdownMenuChecked = boolean | 'indeterminate';

/** Native attributes a part passes through, less the ones it owns. */
type PartAttributes = Omit<
  JSX.HTMLAttributes<FloatingElement>,
  'role' | 'children' | 'color' | 'onSelect'
>;

/**
 * The handlers an item owns. Selection is `onSelect`; the rest drive
 * focus and choosing, so they aren't the caller's to replace.
 */
type ItemHandler =
  | 'onClick'
  | 'onclick'
  | 'onKeyDown'
  | 'onkeydown'
  | 'onPointerDown'
  | 'onpointerdown'
  | 'onPointerUp'
  | 'onpointerup'
  | 'onPointerMove'
  | 'onpointermove'
  | 'onPointerLeave'
  | 'onpointerleave';

/** Props every kind of item shares. */
interface ItemOwnProps
  extends RequiredTestIdProps, Omit<PartAttributes, ItemHandler> {
  /** Skips the item for focus and selection. @default false */
  disabled?: boolean;

  /**
   * Text typeahead matches the item by. Defaults to its text content;
   * set it when that's empty or misleading, such as an icon-only item.
   */
  textValue?: string;

  /** Class merged onto the item. */
  class?: string;

  /** The item's label. */
  children: JSX.Element;
}

/** What the shared item needs on top of a part's props. */
interface ItemImplProps extends ItemOwnProps {
  role: 'menuitem' | 'menuitemcheckbox' | 'menuitemradio';
  color?: DropdownMenuColor;
  checkable?: boolean;
  shortcut?: string;
  onSelect?: (event: Event) => void;
  indicator?: JSX.Element;
}

/**
 * The behavior every item shares: focus that follows the mouse,
 * selection by click, Enter, Space, or a press released over it, and
 * the menu closing afterward unless the selection was cancelled.
 */
const ItemImpl = (props: ItemImplProps) => {
  const [local, rest] = splitProps(props, [
    'role',
    'color',
    'checkable',
    'shortcut',
    'onSelect',
    'indicator',
    'disabled',
    'textValue',
    'class',
    'children',
    'testId',
  ]);

  const menu = useDropdownMenuContext();
  const tag = useFloatingTag();

  // Whether the press began on this item. One that began elsewhere —
  // on the trigger, dragged across — selects on release instead.
  let pressed = false;

  const register = (element: HTMLElement) => {
    menu.textValues.set(element, local);
  };

  const select = () => {
    if (local.disabled) return;

    const event = new Event('select', { cancelable: true });
    local.onSelect?.(event);

    if (event.defaultPrevented) pressed = false;
    else menu.close();
  };

  const isMouse = (event: PointerEvent) => event.pointerType === 'mouse';

  return (
    <Dynamic
      component={tag()}
      {...rest}
      ref={register}
      role={local.role}
      // A disabled item isn't focusable, so a press on it lands on the
      // surface and nothing highlights.
      tabindex={local.disabled ? undefined : -1}
      aria-disabled={local.disabled || undefined}
      class={clx(
        css.item,
        local.checkable && css.checkable,
        local.color && css.itemColor[local.color],
        local.disabled && css.disabled,
        local.class,
      )}
      data-testid={local.testId}
      onClick={select}
      onPointerDown={() => {
        pressed = true;
      }}
      onPointerUp={(event: PointerEvent) => {
        if (!pressed) (event.currentTarget as HTMLElement).click();
      }}
      onKeyDown={(event: KeyboardEvent) => {
        if (local.disabled) return;
        if (menu.typingAhead() && event.key === ' ') return;

        if (event.key === 'Enter' || event.key === ' ') {
          (event.currentTarget as HTMLElement).click();
          // Selection only: no page scroll, and no keydown landing on
          // whatever takes focus next.
          event.preventDefault();
        }
      }}
      // Move rather than enter, so focus comes back to the item under a
      // still mouse after the keyboard has moved it elsewhere.
      onPointerMove={(event: PointerEvent) => {
        if (!isMouse(event)) return;

        const item = event.currentTarget as HTMLElement;
        if (local.disabled) menu.surface()?.focus(NO_SCROLL);
        else if (document.activeElement !== item) item.focus(NO_SCROLL);
      }}
      onPointerLeave={(event: PointerEvent) => {
        if (isMouse(event)) menu.surface()?.focus(NO_SCROLL);
      }}
    >
      {local.indicator}
      {local.children}
      <Show when={local.shortcut}>
        <Dynamic component={tag()} class={css.shortcut}>
          {local.shortcut}
        </Dynamic>
      </Show>
    </Dynamic>
  );
};

/** The check gutter, filled while the item is on. */
const Indicator = (props: { checked: DropdownMenuChecked }) => {
  const tag = useFloatingTag();

  return (
    <Show when={props.checked !== false}>
      <Dynamic component={tag()} class={css.indicator} aria-hidden="true">
        <Switch>
          <Match when={props.checked === 'indeterminate'}>
            <IconMinus class={css.indicatorIcon} />
          </Match>
          <Match when={props.checked === true}>
            <IconCheck class={css.indicatorIcon} />
          </Match>
        </Switch>
      </Dynamic>
    </Show>
  );
};

/** `DropdownMenuItem` props. */
export interface DropdownMenuItemProps extends ItemOwnProps {
  /**
   * Fires when the item is chosen. The menu closes afterward unless the
   * handler calls `event.preventDefault()`.
   */
  onSelect?: (event: Event) => void;

  /** Keyboard shortcut shown at the end of the item. Display only. */
  shortcut?: string;

  /** Tints the item's text and highlight. Defaults to the menu's. */
  color?: DropdownMenuColor;
}

/** An action in a menu. */
export const DropdownMenuItem = (props: DropdownMenuItemProps) => (
  <ItemImpl {...props} role="menuitem" />
);

/** `DropdownMenuCheckboxItem` props. */
export interface DropdownMenuCheckboxItemProps extends ItemOwnProps {
  /** Whether the item is on. `'indeterminate'` shows a dash. */
  checked: DropdownMenuChecked;

  /**
   * Fires with the next state when the item is chosen: the opposite of
   * `checked`, or `true` from indeterminate. The menu closes afterward
   * unless `onSelect` cancels it.
   */
  onCheckedChange: (checked: boolean) => void;

  /** Fires when the item is chosen, before `onCheckedChange`. */
  onSelect?: (event: Event) => void;

  /** Keyboard shortcut shown at the end of the item. Display only. */
  shortcut?: string;

  /** Tints the item's text and highlight. Defaults to the menu's. */
  color?: DropdownMenuColor;
}

/** A menu item that toggles a setting on and off. */
export const DropdownMenuCheckboxItem = (
  props: DropdownMenuCheckboxItemProps,
) => {
  const [local, rest] = splitProps(props, [
    'checked',
    'onCheckedChange',
    'onSelect',
  ]);

  return (
    <ItemImpl
      {...rest}
      role="menuitemcheckbox"
      checkable
      aria-checked={local.checked === 'indeterminate' ? 'mixed' : local.checked}
      indicator={<Indicator checked={local.checked} />}
      onSelect={(event) => {
        local.onSelect?.(event);
        local.onCheckedChange(
          local.checked === 'indeterminate' ? true : !local.checked,
        );
      }}
    />
  );
};

/** `DropdownMenuRadioGroup` props. */
export interface DropdownMenuRadioGroupProps
  extends TestIdProps, PartAttributes {
  /** Value of the chosen item. */
  value: string;

  /** Fires with an item's value when it's chosen. */
  onValueChange: (value: string) => void;

  /** Class merged onto the group. */
  class?: string;

  /** The group's `DropdownMenuRadioItem`s, and anything between them. */
  children: JSX.Element;
}

/** A set of radio items, one of which is chosen. */
export const DropdownMenuRadioGroup = (props: DropdownMenuRadioGroupProps) => {
  const [local, rest] = splitProps(props, [
    'value',
    'onValueChange',
    'class',
    'testId',
    'children',
  ]);
  const tag = useFloatingTag();

  return (
    <DropdownMenuRadioContext.Provider
      value={{
        value: () => local.value,
        onValueChange: (value) => local.onValueChange(value),
      }}
    >
      <Dynamic
        component={tag()}
        {...rest}
        role="group"
        class={clx(css.group, local.class)}
        data-testid={local.testId}
      >
        {local.children}
      </Dynamic>
    </DropdownMenuRadioContext.Provider>
  );
};

/** `DropdownMenuRadioItem` props. */
export interface DropdownMenuRadioItemProps extends ItemOwnProps {
  /** The value the group takes when this item is chosen. */
  value: string;

  /** Fires when the item is chosen, before the group's `onValueChange`. */
  onSelect?: (event: Event) => void;

  /** Tints the item's text and highlight. Defaults to the menu's. */
  color?: DropdownMenuColor;
}

/** One choice in a `DropdownMenuRadioGroup`. */
export const DropdownMenuRadioItem = (props: DropdownMenuRadioItemProps) => {
  const [local, rest] = splitProps(props, ['value', 'onSelect']);
  const group = useDropdownMenuRadioContext();
  const checked = () => group.value() === local.value;

  return (
    <ItemImpl
      {...rest}
      role="menuitemradio"
      checkable
      aria-checked={checked()}
      indicator={<Indicator checked={checked()} />}
      onSelect={(event) => {
        local.onSelect?.(event);
        group.onValueChange(local.value);
      }}
    />
  );
};

/** `DropdownMenuGroup` props. */
export interface DropdownMenuGroupProps extends TestIdProps, PartAttributes {
  /** Class merged onto the group. */
  class?: string;

  /** The grouped items. */
  children: JSX.Element;
}

/**
 * A run of related items. Name it with `aria-labelledby` pointing at a
 * `DropdownMenuLabel`, or with `aria-label`.
 */
export const DropdownMenuGroup = (props: DropdownMenuGroupProps) => {
  const [local, rest] = splitProps(props, ['class', 'testId', 'children']);
  const tag = useFloatingTag();

  return (
    <Dynamic
      component={tag()}
      {...rest}
      role="group"
      class={clx(css.group, local.class)}
      data-testid={local.testId}
    >
      {local.children}
    </Dynamic>
  );
};

/** `DropdownMenuLabel` props. */
export interface DropdownMenuLabelProps extends TestIdProps, PartAttributes {
  /** Class merged onto the label. */
  class?: string;

  /** The label text. */
  children: JSX.Element;
}

/** A heading over a run of items. Not focusable or selectable. */
export const DropdownMenuLabel = (props: DropdownMenuLabelProps) => {
  const [local, rest] = splitProps(props, ['class', 'testId', 'children']);
  const tag = useFloatingTag();

  return (
    <Dynamic
      component={tag()}
      {...rest}
      class={clx(css.label, local.class)}
      data-testid={local.testId}
    >
      {local.children}
    </Dynamic>
  );
};

/** `DropdownMenuSeparator` props. */
export interface DropdownMenuSeparatorProps
  extends TestIdProps, Omit<PartAttributes, 'aria-orientation'> {
  /** Class merged onto the separator. */
  class?: string;
}

/** A rule between groups of items. */
export const DropdownMenuSeparator = (props: DropdownMenuSeparatorProps) => {
  const [local, rest] = splitProps(props, ['class', 'testId']);
  const tag = useFloatingTag();

  return (
    <Dynamic
      component={tag()}
      {...rest}
      role="separator"
      aria-orientation="horizontal"
      class={clx(css.separator, local.class)}
      data-testid={local.testId}
    />
  );
};

/** `DropdownMenuTriggerIcon` props. */
export type DropdownMenuTriggerIconProps = JSX.SvgSVGAttributes<SVGSVGElement>;

/** The chevron a trigger shows to say it opens a menu. */
export const DropdownMenuTriggerIcon = (
  rawProps: DropdownMenuTriggerIconProps,
) => {
  const props = mergeProps({ 'aria-hidden': true } as const, rawProps);

  return <IconChevronDown {...props} />;
};
