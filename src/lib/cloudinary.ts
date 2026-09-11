export const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dv8woouru';
export const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

/**
 * Converts any user image file to WebP format client-side before upload.
 * Reduces file size significantly (up to 80%), saves Cloudinary storage and ensures fast delivery.
 */
export async function convertImageToWebP(
  file: File,
  quality = 0.85,
  maxWidth = 2048,
  maxHeight = 2048
): Promise<File> {
  // If in a non-browser environment or canvas unsupported, return original
  if (typeof window === 'undefined' || !window.createImageBitmap) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { naturalWidth: width, naturalHeight: height } = img;

      // Restrict max dimensions to avoid unnecessarily huge storage usage
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(file);
        return;
      }

      // Draw onto canvas
      ctx.drawImage(img, 0, 0, width, height);

      // Export as WebP
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const baseName = file.name.replace(/\.[^/.]+$/, '');
          const webpFile = new File([blob], `${baseName}.webp`, {
            type: 'image/webp',
            lastModified: Date.now(),
          });
          resolve(webpFile);
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

/**
 * Ensures any Cloudinary URL serves modern WebP format with auto quality (f_webp,q_auto).
 */
export function formatCloudinaryWebPUrl(url: string): string {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) {
    return url;
  }
  if (url.includes('/upload/f_webp') || url.includes('/upload/f_auto')) {
    return url;
  }
  return url.replace('/upload/', '/upload/f_webp,q_auto/');
}

/**
 * Uploads an image file to Cloudinary unsigned upload preset,
 * automatically converting to WebP format for optimal storage and loading speed.
 * @param file File object from file input
 * @returns Promise<string> The secure HTTPS URL of the uploaded image in WebP format
 */
export async function uploadToCloudinary(file: File): Promise<string> {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file (PNG, JPG, WEBP, etc.)');
  }

  // Validate size (under 15MB before compression)
  if (file.size > 15 * 1024 * 1024) {
    throw new Error('Image size should be under 15MB');
  }

  // Convert to WebP client-side before uploading to save storage & upload time
  let fileToUpload = file;
  try {
    fileToUpload = await convertImageToWebP(file);
  } catch (err) {
    console.warn('Could not convert to WebP client-side, using original file', err);
  }

  const formData = new FormData();
  formData.append('file', fileToUpload);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'Cloudinary upload failed');
  }

  const data = await response.json();
  const rawUrl = data.secure_url;
  return formatCloudinaryWebPUrl(rawUrl);
}
