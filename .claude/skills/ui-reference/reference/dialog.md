# Dialog

Modal dialog built on a native `<dialog>` promoted to the top layer by `showModal()`. Renders in place — no portal — so it paints above every stacking context regardless of where it sits in the tree, and inherits typography and color from its real ancestors. The platform supplies the focus trap, inerting of the rest of the document, Escape handling, and focus restoration on close.

A single flat export, not a compound: the title and description are props, openers are ordinary buttons the call site already owns, and closing is `onOpenChange(false)`. Fully controlled — there is no `defaultOpen`. Modal only.

The panel fills its own scroll surface, so content taller than the viewport scrolls with the panel rather than being clipped. Body content mounts when the dialog opens and unmounts after the exit animation settles, so form state does not survive a close.

Initial focus is the platform's: the first `autofocus` descendant, else the first focusable one, else the dialog itself.

Escape is not always refusable. It does not count as user activation, so a run of presses with nothing in between spends the document's history-action activation and the browser closes the element regardless — its guard against pages that trap you. The dialog goes straight back up, so `dismissible: false` holds, but that one press is visible.

## Props

Base: `<div>` attributes on the panel (except `title`, `style`).

- `testId` (required): Test identifier rendered as `data-testid` on the panel.
- `open` (required): Whether the dialog is showing.
- `onOpenChange` (required): Fires when the user asks to close (Escape, or a click outside the panel). Only ever called with `false`.
- `title` (required): Heading at the top of the panel. Also the dialog's accessible name.
- `description`: Supporting copy under the title. Wired to `aria-describedby`.
- `size` (=`3`): Panel padding and rounding. `1 | 2 | 3 | 4`.
- `align` (=`'center'`): Where the panel sits when shorter than the viewport. `'start' | 'center'`.
- `dismissible` (=`true`): Let Escape and outside clicks close the dialog. Turn off for flows that must end in an explicit choice.
- `maxWidth` (=`'600px'`): Any CSS width for the panel.
- `class`: Class applied to the panel (the visible surface), not the overlay.
- `children`: Body content, rendered under the title and description.
