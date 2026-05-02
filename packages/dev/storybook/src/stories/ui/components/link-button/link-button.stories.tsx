import { MemoryRouter, Route } from '@solidjs/router';
import type { Meta, StoryObj } from 'storybook-solidjs-vite';
import { fn } from 'storybook/test';
import { LinkButton, type LinkButtonProps } from '@lib/ui';
import { buttonStyleArgTypes } from '@lib/ui/props/button';
import { marginArgTypes } from '@lib/ui/props/margin';
import { skeletonArgs, skeletonArgTypes } from '@lib/ui/props/skeleton';
import { testIdArgTypes } from '@lib/ui/props/test-id';
import { gallery } from '../../../../gallery';

const VARIANTS = ['solid', 'soft', 'surface', 'outline', 'ghost'] as const;
const COLORS = ['accent', 'neutral', 'danger', 'warning', 'success'] as const;
const SIZES = [1, 2, 3, 4] as const;
const RADII = ['none', 'small', 'medium', 'large', 'full'] as const;

const defaults = { href: '/', testId: 'overview' } as const;

// Each gallery item gets its own router context so module-level JSX
// can call LinkButton's router primitives without depending on the
// meta decorator (which only wraps the rendered Story).
const Demo = (props: LinkButtonProps) => (
  <MemoryRouter>
    <Route path="*" component={() => <LinkButton {...props} />} />
  </MemoryRouter>
);

const meta = {
  title: 'UI/Components/LinkButton',
  component: LinkButton,
  args: {
    children: 'Link Button',
    href: '/',
    size: 2,
    variant: 'solid',
    color: 'accent',
    onClick: fn(),
    ...skeletonArgs,
  },
  argTypes: {
    ...marginArgTypes,
    ...buttonStyleArgTypes,
    ...skeletonArgTypes,
    ...testIdArgTypes,
    children: { control: 'text' },
    href: { control: 'text' },
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Route path="*" component={() => <Story />} />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<LinkButtonProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = gallery({
  sections: [
    {
      title: 'Variant',
      items: VARIANTS.map((variant) => (
        <Demo {...defaults} variant={variant}>
          {variant}
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
      title: 'Radius',
      items: RADII.map((radius) => (
        <Demo {...defaults} radius={radius}>
          {radius}
        </Demo>
      )),
    },
  ],
});

export const Playground: Story = {};
