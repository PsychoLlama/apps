/**
 * Hand bytes to the browser to save as `name`, through a synthetic anchor
 * click.
 *
 * The `download` attribute is what keeps this a save and never a
 * navigation: the bytes came from another device, and nothing here should
 * open them in this origin.
 */
export const saveFile = (bytes: Blob, name: string): void => {
  const url = URL.createObjectURL(bytes);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  // The download holds its own reference once it has started.
  URL.revokeObjectURL(url);
};
