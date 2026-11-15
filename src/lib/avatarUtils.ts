export const processAvatarImageFile = async (file: File): Promise<string> => {
  if (file.type === 'image/svg+xml') {
    const text = await file.text();
    if (!text.includes('<svg')) {
      throw new Error('The selected SVG file appears to be invalid.');
    }
    const cleanBase64 = btoa(unescape(encodeURIComponent(text)));
    return `data:image/svg+xml;base64,${cleanBase64}`;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Unable to decode image. Please choose a valid PNG, JPG, or WebP file.'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const size = 256;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas rendering context is not available.');

          // Square center-crop (cover behavior)
          const minSide = Math.min(img.naturalWidth, img.naturalHeight);
          const sx = (img.naturalWidth - minSide) / 2;
          const sy = (img.naturalHeight - minSide) / 2;

          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);

          const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          // Wrap in a lightweight SVG to satisfy backend storage/RPC validation requirements
          const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><image href="${jpegDataUrl}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid slice"/></svg>`;
          const encoded = btoa(unescape(encodeURIComponent(svgMarkup)));
          resolve(`data:image/svg+xml;base64,${encoded}`);
        } catch (error) {
          reject(error);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
};
