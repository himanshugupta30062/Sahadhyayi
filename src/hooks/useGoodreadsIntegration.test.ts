import { describe, it, expect, vi } from 'vitest';
import { useGoodreadsIntegration } from './useGoodreadsIntegration';
import { secureFetch } from '../security/secureFetch';

vi.mock('../security/secureFetch', () => ({
  secureFetch: vi.fn(),
}));

describe('useGoodreadsIntegration', () => {
  it('opens login popup on initiateLogin', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const { initiateLogin } = useGoodreadsIntegration();
    initiateLogin();
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('/goodreads/connect'),
      '_blank',
      'width=600,height=600'
    );
    openSpy.mockRestore();
  });

  it('imports books via secureFetch and handles unlinked gracefully', async () => {
    vi.mocked(secureFetch).mockResolvedValueOnce({
      json: async () => [{ id: '1', title: 'Book 1' }],
    } as unknown as Response);

    const { importBooks } = useGoodreadsIntegration();
    const books = await importBooks();
    expect(books).toEqual([{ id: '1', title: 'Book 1' }]);

    const unlinkedErr: any = new Error('Not linked');
    unlinkedErr.code = 'GOODREADS_NOT_LINKED';
    vi.mocked(secureFetch).mockRejectedValueOnce(unlinkedErr);
    const unlinkedResult = await importBooks();
    expect(unlinkedResult).toBeNull();
  });

  it('exports history via POST to /goodreads/export', async () => {
    vi.mocked(secureFetch).mockResolvedValueOnce({} as unknown as Response);
    const { exportHistory } = useGoodreadsIntegration();
    await exportHistory([{ id: '1', title: 'Book 1' }]);
    expect(secureFetch).toHaveBeenCalledWith('/goodreads/export', expect.objectContaining({
      method: 'POST',
    }));
  });
});
