import { createTestBindings } from '@lib/state';
import type { LogFileInfo } from '@lib/observability';
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

    useAction(setFiles)(files);

    expect(archive.status).toBe('ready');
    expect(archive.files).toEqual(files);
  });
});

describe('markError', () => {
  it('flags the failure without dropping a previously loaded list', () => {
    const { archive, useAction } = setup();
    const files = [file('1-a.ndjson')];

    useAction(setFiles)(files);
    useAction(markError)();

    expect(archive.status).toBe('error');
    expect(archive.files).toEqual(files);
  });
});
