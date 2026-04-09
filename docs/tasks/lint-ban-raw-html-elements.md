## Lint rule: ban raw HTML elements

Add a custom lint rule that forbids raw HTML elements (`div`, `section`,
`p`, `span`, etc.) when an equivalent `#ui` component exists (`Box`,
`Flex`, `Grid`, `Text`, `Heading`). Enforce that UI is built through the
design system primitives.
