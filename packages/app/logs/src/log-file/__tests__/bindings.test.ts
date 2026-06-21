import { createTestBindings } from '@lib/state';
import { markFileError, markFileLoading, setLogFile } from '../bindings';
import { logFileStore } from '../store';

const setup = () => {
  const bindings = createTestBindings();
  return { ...bindings, fileState: bindings.createStore(logFileStore) };
};

const logFile = () => new File(['log'], '1-a.ndjson');

describe('markFileLoading', () => {
  it('enters the loading state and clears any prior file', () => {
    const { fileState, useAction } = setup();

    useAction(setLogFile)({ file: logFile(), downloadUrl: 'blob:a' });
    useAction(markFileLoading)();

    expect(fileState.status).toBe('loading');
    expect(fileState.file).toBeNull();
    expect(fileState.downloadUrl).toBeNull();
  });
});

describe('setLogFile', () => {
  it('commits the resolved file and its download URL', () => {
    const { fileState, useAction } = setup();
    const file = logFile();

    useAction(setLogFile)({ file, downloadUrl: 'blob:a' });

    expect(fileState.status).toBe('ready');
    expect(fileState.file?.current).toBe(file);
    expect(fileState.downloadUrl).toBe('blob:a');
  });
});

describe('markFileError', () => {
  it('flags a genuine read failure', () => {
    const { fileState, useAction } = setup();

    useAction(markFileLoading)();
    useAction(markFileError)(new Error('disk gone'));

    expect(fileState.status).toBe('error');
  });

  it('records the not-found state for a missing file', () => {
    const { fileState, useAction } = setup();

    useAction(markFileLoading)();
    useAction(markFileError)(new DOMException('missing', 'NotFoundError'));

    expect(fileState.status).toBe('not-found');
  });

  it('ignores an abort so a superseded read never clobbers fresh state', () => {
    const { fileState, useAction } = setup();
    const file = logFile();

    useAction(setLogFile)({ file, downloadUrl: 'blob:a' });
    useAction(markFileError)(new DOMException('Aborted', 'AbortError'));

    expect(fileState.status).toBe('ready');
    expect(fileState.file?.current).toBe(file);
    expect(fileState.downloadUrl).toBe('blob:a');
  });
});
