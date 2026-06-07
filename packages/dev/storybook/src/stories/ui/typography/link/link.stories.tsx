import { MemoryRouter } from '@solidjs/router';
import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { fn } from 'storybook/test';
import { Link, type LinkProps } from '@lib/ui';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';
import { trimArgTypes } from '@lib/ui/props/trim';
import { truncateArgTypes } from '@lib/ui/props/truncate';
import { wrapArgTypes } from '@lib/ui/props/wrap';
import { gallery } from '../../../../gallery';

const UNDERLINES = ['auto', 'always', 'hover', 'none'] as const;
const COLORS = ['accent', 'neutral'] as const;
const SIZES = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
const WEIGHTS = ['light', 'regular', 'medium', 'bold'] as const;

const defaults = { href: '/example', testId: 'overview' } as const;

// Each gallery item gets its own router context so module-level JSX
// can call Link's router primitives without depending on the meta
// decorator (which only wraps the rendered Story).
const Demo = (props: LinkProps) => (
  <MemoryRouter root={() => <Link {...props} />} />
);

const meta = {
  title: 'UI/Typography/Link',
  component: Link,
  decorators: [(Story) => <MemoryRouter root={() => Story()} />],
  args: {
    children: 'Click here',
    href: '/example',
    underline: 'auto',
    color: 'accent',
    highContrast: false,
    size: 3,
    onClick: fn(),
    ...skeletonArgs,
  },
  argTypes: {
    size: {
      control: { type: 'range', min: 1, max: 9, step: 1 },
    },
    weight: {
      control: 'inline-radio',
      options: ['light', 'regular', 'medium', 'bold'],
    },
    underline: {
      control: 'inline-radio',
      options: ['auto', 'always', 'hover', 'none'],
    },
    color: {
      control: 'inline-radio',
      options: ['accent', 'neutral'],
    },
    highContrast: { control: 'boolean' },
    external: { control: 'boolean' },
    children: { control: 'text' },
    ...trimArgTypes,
    ...truncateArgTypes,
    ...wrapArgTypes,
    ...marginArgTypes,
    ...skeletonArgTypes,
    ...testIdArgTypes,
  },
} satisfies Meta<LinkProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = gallery({
  sections: [
    {
      title: 'Underline',
      items: UNDERLINES.map((underline) => (
        <Demo {...defaults} underline={underline}>
          {underline}
        </Demo>
      )),
    },
    {
      title: 'Color',
      items: COLORS.map((color) => (
        <Demo {...defaults} color={color}>
          {color}
        </Demo>
      )),
    },
    {
      title: 'Size',
      items: SIZES.map((size) => (
        <Demo {...defaults} size={size}>
          Size {size}
        </Demo>
      )),
    },
    {
      title: 'Weight',
      items: WEIGHTS.map((weight) => (
        <Demo {...defaults} weight={weight}>
          {weight}
        </Demo>
      )),
    },
    {
      title: 'High contrast',
      items: COLORS.map((color) => (
        <Demo {...defaults} color={color} highContrast>
          {color}
        </Demo>
      )),
    },
    {
      // `external` renders a native `<a>` so the router doesn't resolve
      // the href — required for other origins and `mailto:` / `tel:`.
      title: 'External',
      items: [
        <Demo
          {...defaults}
          external
          href="https://example.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          https://example.com
        </Demo>,
        <Demo {...defaults} external href="mailto:hi@example.com">
          hi@example.com
        </Demo>,
        <Demo {...defaults} external href="tel:+15551234567">
          +1 (555) 123-4567
        </Demo>,
      ],
    },
  ],
});

export const Playground: Story = {};
