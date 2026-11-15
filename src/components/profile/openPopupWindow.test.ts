import { describe, it, expect, vi, beforeEach } from 'vitest';
import { openPopupWindow } from './openPopupWindow';

describe('openPopupWindow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls window.open with calculated centered coordinates', () => {
    const focusMock = vi.fn();
    const openMock = vi.spyOn(window, 'open').mockReturnValue({
      closed: false,
      focus: focusMock,
    } as unknown as Window);

    openPopupWindow('https://example.com', 'Test Window');
    expect(openMock).toHaveBeenCalledWith(
      'https://example.com',
      'Test Window',
      expect.stringContaining('width=600,height=700')
    );
    expect(focusMock).toHaveBeenCalled();
  });

  it('falls back to new tab when popup is blocked', () => {
    const openMock = vi.spyOn(window, 'open').mockReturnValue(null);

    openPopupWindow('https://example.com');
    expect(openMock).toHaveBeenCalledWith(
      'https://example.com',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('falls back to new tab if window.open throws an error', () => {
    let callCount = 0;
    const openMock = vi.spyOn(window, 'open').mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        throw new Error('Blocked');
      }
      return null;
    });

    openPopupWindow('https://example.com');
    expect(openMock).toHaveBeenCalledTimes(2);
  });
});
