/** How often an opened tab is checked for having been closed, in ms. */
const CLOSED_CHECK = 5000;

/** A tab opened for a file, waiting for the file's bytes. */
export interface FileTab {
  /**
   * Show `bytes` in the tab, as whatever type they carry. Only for a
   * type that can't run anything: the tab shares this app's origin.
   */
  show(bytes: Blob): void;

  /** Close the tab: there turned out to be nothing to show. */
  close(): void;
}

/**
 * Open an empty tab for a file to be shown in, or `null` if the browser
 * wouldn't.
 *
 * Call it straight from a click, before reading the file. A browser only
 * opens a tab while it can see someone asked for one, and reading a file
 * takes long enough for it to forget.
 *
 * The tab is cut off from this page before anything loads in it.
 */
export const openFileTab = (): FileTab | null => {
  const tab = window.open('about:blank', '_blank');
  if (!tab) return null;

  tab.opener = null;

  return {
    show(bytes) {
      const url = URL.createObjectURL(bytes);
      tab.location.replace(url);

      // The tab reads from the URL for as long as it's open: a reload, a
      // seek in a video, a save from a PDF viewer. So it's kept until the
      // tab is gone.
      const watch = setInterval(() => {
        if (!tab.closed) return;

        clearInterval(watch);
        URL.revokeObjectURL(url);
      }, CLOSED_CHECK);
    },

    close: () => tab.close(),
  };
};
