import type { Listing } from '#gallery';
import Button, { type ButtonProps } from './button';

/**
 * Gallery listing for `Button`. Enumerates the component across its visual
 * axes. `ButtonProps` is a union over `as`; pin the `<button>` arm so
 * `Partial<P>` keeps the full prop set.
 */
export default {
  title: 'Button',
  group: 'form',
  render: (props) => (
    <Button as="button" testId="button" {...props}>
      Continue
    </Button>
  ),
  sections: [
    {
      title: 'Theme colors',
      columns: [
        { title: 'Solid', props: { variant: 'solid' } },
        { title: 'Soft', props: { variant: 'soft' } },
        { title: 'Surface', props: { variant: 'surface' } },
        { title: 'Outline', props: { variant: 'outline' } },
        { title: 'Ghost', props: { variant: 'ghost' } },
      ],
      rows: [
        { title: 'Default', props: {} },
        { title: 'Disabled', props: { disabled: true } },
      ],
    },
    {
      title: 'Color',
      columns: [
        { title: 'Accent', props: { color: 'accent' } },
        { title: 'Neutral', props: { color: 'neutral' } },
        { title: 'Danger', props: { color: 'danger' } },
        { title: 'Warning', props: { color: 'warning' } },
        { title: 'Success', props: { color: 'success' } },
      ],
    },
    {
      title: 'Radius',
      columns: [
        { title: 'None', props: { radius: 'none' } },
        { title: 'Small', props: { radius: 'small' } },
        { title: 'Medium', props: { radius: 'medium' } },
        { title: 'Large', props: { radius: 'large' } },
        { title: 'Full', props: { radius: 'full' } },
      ],
    },
  ],
} satisfies Listing<Extract<ButtonProps, { as?: 'button' }>>;
