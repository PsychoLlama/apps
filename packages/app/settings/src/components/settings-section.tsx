import type { JSX } from 'solid-js';
import { Flex, Heading, Text } from '@lib/ui';

/** Props for {@link SettingsSection}. */
export interface SettingsSectionProps {
  /** Visible heading text. */
  title: string;
  /**
   * `id` for the heading, so the section's control can point
   * `aria-labelledby` at it.
   */
  headingId: string;
  /** One-line summary under the heading. */
  description: string;
  /** Inline control beside the heading, usually a `ResetButton`. */
  action?: JSX.Element;
  /** The setting's control. */
  children: JSX.Element;
}

/**
 * Shared layout for a top-level settings section: a heading with an
 * inline action, a muted description, then the control.
 */
export const SettingsSection = (props: SettingsSectionProps) => (
  <Flex as="section" direction="column" gap={3}>
    <Flex as="header" direction="column" gap={2}>
      <Flex as="div" direction="row" justify="between" align="center" gap={3}>
        <Heading
          as="h2"
          id={props.headingId}
          size={4}
          weight="medium"
          selectable={false}
        >
          {props.title}
        </Heading>
        {props.action}
      </Flex>
      <Text as="p" size={2} color="lowContrast" selectable={false}>
        {props.description}
      </Text>
    </Flex>

    {props.children}
  </Flex>
);
