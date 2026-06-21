import { createTestBindings } from '@lib/state';
import type { LogFileInfo } from '../log-archive';
import { addFile, markError, markLoading, setFiles } from '../bindings';
import { logArchiveStore } from '../store';

const setup = () => {
  const bindings = createTestBindings();
  return { ...bindings, archive: bindings.createStore(logArchiveStore) };
};

const file = (name: string, createdAt?: number): LogFileInfo => ({
  name,
  createdAt,
});

describe('markLoading', () => {
  it('enters the loading state', () => {
    const { archive, useAction } = setup();

    useAction(markLoading)();

    expect(archive.status).toBe('loading');
  });
});

describe('setFiles', () => {
  it('commits the enumeration and marks the archive ready', () => {
    const { archive, useAction } = setup();
    const files = [file('2-b.ndjson'), file('1-a.ndjson')];

    useAction(setFiles)({ files, activeFiles: new Set(['2-b.ndjson']) });

    expect(archive.status).toBe('ready');
    expect(archive.files).toEqual(files);
    expect(archive.activeFiles).toEqual(new Set(['2-b.ndjson']));
  });

  it('leaves the active set in place when the lock query failed', () => {
    const { archive, useAction } = setup();

    useAction(setFiles)({
      files: [file('1-a.ndjson')],
      activeFiles: new Set(['1-a.ndjson']),
    });
    useAction(setFiles)({
      files: [file('1-a.ndjson')],
      activeFiles: undefined,
    });

    expect(archive.activeFiles).toEqual(new Set(['1-a.ndjson']));
  });
});

describe('addFile', () => {
  it('splices a new file in newest-first', () => {
    const { archive, useAction } = setup();
    useAction(setFiles)({
      files: [file('3-c.ndjson', 3), file('1-a.ndjson', 1)],
      activeFiles: new Set(),
    });

    useAction(addFile)(file('2-b.ndjson', 2));

    expect(archive.files).toEqual([
      file('3-c.ndjson', 3),
      file('2-b.ndjson', 2),
      file('1-a.ndjson', 1),
    ]);
  });

  it('ignores a file already in the listing', () => {
    const { archive, useAction } = setup();
    useAction(setFiles)({
      files: [file('1-a.ndjson', 1)],
      activeFiles: new Set(),
    });

    useAction(addFile)(file('1-a.ndjson', 1));

    expect(archive.files).toEqual([file('1-a.ndjson', 1)]);
  });
});

describe('markError', () => {
  it('flags the failure without dropping a previously loaded list', () => {
    const { archive, useAction } = setup();
    const files = [file('1-a.ndjson')];

    useAction(setFiles)({ files, activeFiles: new Set() });
    useAction(markError)();

    expect(archive.status).toBe('error');
    expect(archive.files).toEqual(files);
  });
});
