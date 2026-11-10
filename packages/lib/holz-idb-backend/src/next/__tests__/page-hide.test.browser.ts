import { onPageHide } from '../page-hide';

const setVisibility = (state: DocumentVisibilityState) => {
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(state);
  document.dispatchEvent(new Event('visibilitychange'));
};

describe('onPageHide', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls the listener when the page is hidden', () => {
    const listener = vi.fn();
    const unsubscribe = onPageHide(listener);

    setVisibility('hidden');
    unsubscribe();

    expect(listener).toHaveBeenCalledOnce();
  });

  it('ignores the page being shown', () => {
    const listener = vi.fn();
    const unsubscribe = onPageHide(listener);

    setVisibility('visible');
    unsubscribe();

    expect(listener).not.toHaveBeenCalled();
  });

  it('stops calling the listener after unsubscribing', () => {
    const listener = vi.fn();

    onPageHide(listener)();
    setVisibility('hidden');

    expect(listener).not.toHaveBeenCalled();
  });
});
