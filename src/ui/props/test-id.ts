import type { ArgTypes } from 'storybook-solidjs-vite';

export interface TestIdProps {
  /** Test identifier. Renders as `data-testid` on the underlying DOM node. */
  testId?: string;
}

export const testIdPropKeys = ['testId'] as const;

export function resolveTestIdAttr({ testId }: TestIdProps) {
  return testId ? { 'data-testid': testId } : undefined;
}

export const testIdArgTypes: ArgTypes<TestIdProps> = {
  testId: {
    control: 'text',
  },
};
