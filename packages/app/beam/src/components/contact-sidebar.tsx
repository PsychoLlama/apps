import { Flex } from '@lib/ui';
import { ContactDirectory } from './contact-directory';
import * as styles from './contact-sidebar.css';

/**
 * The address book as a persistent rail down the left of every `/beam/*`
 * route, on screens with the width to spare.
 *
 * Sharing is a back-and-forth between devices, and on a phone that costs a
 * navigation each way. A wide screen has room to keep the book open while
 * you're using it, so the list stops being a page you leave and becomes the
 * thing you steer with — which is also why the rows highlight the peer
 * currently open.
 *
 * A `<nav>`, since that's what it is: the same set of links the home page
 * lists, kept on screen. Its label is what tells a screen reader which of the
 * two copies this one is.
 */
export const ContactSidebar = () => (
  <Flex
    as="nav"
    direction="column"
    class={styles.sidebar}
    aria-label="Contacts"
  >
    <ContactDirectory testId="beam-sidebar" />
  </Flex>
);
