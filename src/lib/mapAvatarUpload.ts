import { supabase } from '@/integrations/supabase/client-universal';

export const MAX_MAP_AVATAR_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_MAP_AVATAR_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const getMapAvatarFileValidationError = (file: Pick<File, 'type' | 'size'>): string | null => {
  if (!ALLOWED_MAP_AVATAR_TYPES.has(file.type)) {
    return 'Choose a JPG, PNG, or WebP image.';
  }
  if (file.size <= 0 || file.size > MAX_MAP_AVATAR_FILE_SIZE) {
    return 'Avatar images must be smaller than 5 MB.';
  }
  return null;
};

/**
 * Converts an uploaded photo or the locally-generated Bitmoji SVG into a
 * compact, circular PNG marker asset. A transparent pin tail keeps the map
 * marker recognizable without relying on Mappls to style an arbitrary image.
 */
export const createMapAvatarMarkerImage = async (source: Blob): Promise<Blob> => {
  const objectUrl = URL.createObjectURL(source);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('The selected avatar image could not be decoded.'));
      image.src = objectUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 184;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Your browser could not prepare the map avatar image.');

    // Draw the lower pointer first so the circular portrait overlaps its base.
    context.fillStyle = '#1C442D';
    context.beginPath();
    context.moveTo(54, 104);
    context.lineTo(106, 104);
    context.lineTo(80, 158);
    context.closePath();
    context.fill();

    context.fillStyle = '#FFFFFF';
    context.beginPath();
    context.moveTo(62, 105);
    context.lineTo(98, 105);
    context.lineTo(80, 145);
    context.closePath();
    context.fill();

    const centerX = 80;
    const centerY = 68;
    const diameter = 116;
    const radius = diameter / 2;
    const scale = Math.max(diameter / image.naturalWidth, diameter / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;

    context.save();
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.clip();
    context.drawImage(
      image,
      centerX - drawWidth / 2,
      centerY - drawHeight / 2,
      drawWidth,
      drawHeight,
    );
    context.restore();

    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.lineWidth = 9;
    context.strokeStyle = '#FFFFFF';
    context.stroke();

    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.lineWidth = 3;
    context.strokeStyle = '#D5B16D';
    context.stroke();

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('The map avatar image could not be encoded.'));
      }, 'image/png');
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

/** Uploads a map-ready avatar to the public-read, owner-write avatars bucket. */
export const uploadMapAvatarImage = async (source: Blob, userId: string): Promise<string> => {
  if (!userId) throw new Error('Sign in to upload your map avatar.');

  const markerImage = await createMapAvatarMarkerImage(source);
  const uniqueId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const path = `${userId}/map-avatar-${uniqueId}.png`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, markerImage, {
      cacheControl: '31536000',
      contentType: 'image/png',
      upsert: false,
    });

  if (error) {
    throw new Error(error.message || 'Avatar upload failed. Please try again.');
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  if (!data?.publicUrl) throw new Error('Avatar uploaded, but its public image URL could not be created.');
  return data.publicUrl;
};
