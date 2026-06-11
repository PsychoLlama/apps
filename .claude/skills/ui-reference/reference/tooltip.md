# Tooltip

Floating label that describes its trigger. Opens on hover (after a delay) or keyboard focus; dismisses on leave, blur, Escape, press, or ancestor scroll. A single component wrapping its trigger — the trigger is the consumer's own element passed as `children` and becomes the anchor. Open state is internal by default; pass `open` + `onOpenChange` to control it. Content is not hoverable (panel is `pointer-events: none`). Disabled triggers can't surface a tooltip.

## Props

- `content` (required): The label shown in the floating panel. Accepts any JSX.
- `children` (required): The trigger. A single element (or component resolving to one); its DOM node receives the hover/focus wiring and anchors the panel.
- `testId`: Test identifier rendered as `data-testid` on the panel.
- `open`: Controlled open state. Omit to let the tooltip manage its own.
- `onOpenChange`: Fires with the next open state on every hover/focus/dismiss transition.
- `delayDuration` (=`700`): Milliseconds the pointer must rest before opening. Keyboard focus always opens instantly.
- `side` (=`'top'`): Preferred side before collision flipping. `'top' | 'right' | 'bottom' | 'left'`.
- `align` (=`'center'`): Alignment along the chosen side. `'start' | 'center' | 'end'`.
