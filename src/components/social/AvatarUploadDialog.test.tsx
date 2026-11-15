import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AvatarUploadDialog } from './AvatarUploadDialog';
import { processAvatarImageFile } from '@/lib/avatarUtils';

const mutateAvatarMock = vi.fn().mockResolvedValue({ id: 'avatar-1' });
const mutateProfileMock = vi.fn().mockResolvedValue({ id: 'user-1' });

vi.mock('@/hooks/useUserAvatar', () => ({
  useUpdateUserAvatar: () => ({
    mutateAsync: mutateAvatarMock,
    isPending: false,
  }),
}));

vi.mock('@/hooks/useUserProfile', () => ({
  useUpsertUserProfile: () => ({
    mutateAsync: mutateProfileMock,
    isPending: false,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('AvatarUploadDialog', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders correctly when open with all 3 tabs and preview HUD', () => {
    render(
      <AvatarUploadDialog
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Upload Map Avatar')).toBeInTheDocument();
    expect(screen.getByText('Map Marker Preview')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /upload/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /web url/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /presets/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save & show on map/i })).toBeInTheDocument();
  });

  it('allows switching to Presets tab and selecting a reader preset', async () => {
    render(
      <AvatarUploadDialog
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    const presetsTab = screen.getByRole('tab', { name: /presets/i });
    fireEvent.pointerDown(presetsTab);
    fireEvent.click(presetsTab);

    const bookLoverPreset = screen.getByRole('button', { name: /book lover/i });
    expect(bookLoverPreset).toBeInTheDocument();

    fireEvent.click(bookLoverPreset);
    expect(screen.getByText('Looking sharp!')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /save & show on map/i }));

    await waitFor(() => {
      expect(mutateAvatarMock).toHaveBeenCalledWith(
        expect.objectContaining({
          avatar_img_url: expect.stringMatching(/^data:image\/svg\+xml;base64,/),
        })
      );
    });
  });

  it('allows pasting an HTTPS image URL and validates input', async () => {
    render(
      <AvatarUploadDialog
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    const urlTab = screen.getByRole('tab', { name: /web url/i });
    fireEvent.pointerDown(urlTab);
    fireEvent.click(urlTab);

    const input = screen.getByPlaceholderText('https://example.com/my-photo.jpg');
    const previewBtn = screen.getByRole('button', { name: /preview/i });

    // Insecure or invalid protocol
    fireEvent.change(input, { target: { value: 'http://insecure.test/img.png' } });
    fireEvent.click(previewBtn);
    expect(screen.getByText('Avatar URL must start with https:// for security.')).toBeInTheDocument();

    // Valid HTTPS
    fireEvent.change(input, { target: { value: 'https://cdn.example.com/photo.jpg' } });
    fireEvent.click(previewBtn);
    expect(screen.queryByText('Avatar URL must start with https:// for security.')).toBeNull();
    expect(screen.getByText('Looking sharp!')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /save & show on map/i }));

    await waitFor(() => {
      expect(mutateAvatarMock).toHaveBeenCalledWith(
        expect.objectContaining({
          avatar_img_url: 'https://cdn.example.com/photo.jpg',
        })
      );
      expect(mutateProfileMock).toHaveBeenCalledWith({
        profile_photo_url: 'https://cdn.example.com/photo.jpg',
      });
    });
  });

  it('rejects files larger than 10MB', async () => {
    render(
      <AvatarUploadDialog
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    const oversizedFile = new File(['x'.repeat(100)], 'huge.png', { type: 'image/png' });
    Object.defineProperty(oversizedFile, 'size', { value: 11 * 1024 * 1024 });

    const input = document.getElementById('avatar-photo-file-input') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [oversizedFile] } });

    await waitFor(() => {
      expect(screen.getByText('Image size exceeds 10MB limit. Please select a smaller photo.')).toBeInTheDocument();
    });
  });

  it('processes valid SVG files into base64 data URLs', async () => {
    const validSvgContent = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><circle cx="32" cy="32" r="32"/></svg>';
    const svgFile = new File([validSvgContent], 'avatar.svg', { type: 'image/svg+xml' });

    const result = await processAvatarImageFile(svgFile);
    expect(result).toMatch(/^data:image\/svg\+xml;base64,/);
  });
});
