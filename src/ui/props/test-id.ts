import type { ArgTypes } from 'storybook-solidjs-vite';

export interface TestIdProps {
  /** Test identifier. Renders as `data-testid` on the underlying DOM node. */
  testId?: string;
}

/** TestIdProps with `testId` required. Used by interactive components. */
export type RequiredTestIdProps = Required<TestIdProps>;

export const testIdPropKeys = ['testId'] as const;

export const testIdArgTypes: ArgTypes<TestIdProps> = {
  testId: {
    control: 'text',
  },
};
