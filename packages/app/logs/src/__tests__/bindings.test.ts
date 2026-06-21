import { createTestBindings } from '@lib/state';
import type { LogFileInfo } from '../log-archive';
import { markError, markLoading, setFiles } from '../bindings';
import { logArchiveStore } from '../store';

const setup = () => {
  const bindings = createTestBindings();
  return { ...bindings, archive: bindings.createStore(logArchiveStore) };
};

const file = (name: string): LogFileInfo => ({
  name,
  createdAt: undefined,
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
