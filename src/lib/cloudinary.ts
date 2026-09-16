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
          const rawBaseName = file.name.replace(/\.[^/.]+$/, '');
          const cleanBase = rawBaseName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'img';
          const uniqueName = `${cleanBase}_${Date.now()}`;
          const webpFile = new File([blob], `${uniqueName}.webp`, {
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
 * Appends a unique timestamp to prevent browser/CDN cache collision on re-uploads.
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
    // Fallback: Ensure even unconverted files get a unique timestamp to avoid cache collision
    const ext = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : '';
    const cleanBase = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_') || 'img';
    fileToUpload = new File([file], `${cleanBase}_${Date.now()}${ext}`, {
      type: file.type,
      lastModified: Date.now(),
    });
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

  // If Cloudinary returned a delete_token, cache it locally for easy deletion
  if (data.delete_token && data.public_id) {
    saveDeleteToken(data.public_id, data.delete_token);
  }

  return formatCloudinaryWebPUrl(rawUrl);
}

export const CLOUDINARY_API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY || '';
export const CLOUDINARY_API_SECRET = import.meta.env.VITE_CLOUDINARY_API_SECRET || '';

const DELETE_TOKENS_STORAGE_KEY = 'kintesi_cloudinary_delete_tokens';

function saveDeleteToken(publicId: string, token: string) {
  try {
    const raw = localStorage.getItem(DELETE_TOKENS_STORAGE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[publicId] = token;
    localStorage.setItem(DELETE_TOKENS_STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

function getDeleteToken(publicId: string): string | null {
  try {
    const raw = localStorage.getItem(DELETE_TOKENS_STORAGE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    return map[publicId] || null;
  } catch {
    return null;
  }
}

/**
 * Extracts public_id from standard Cloudinary image URL
 * e.g. https://res.cloudinary.com/dv8woouru/image/upload/f_webp,q_auto/v1789533087/des_1789533086814.webp
 * -> "des_1789533086814"
 */
export function extractCloudinaryPublicId(url: string): string | null {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) return null;
  try {
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return null;
    const afterUpload = url.substring(uploadIndex + '/upload/'.length);
    const segments = afterUpload.split('/');
    const pathSegments: string[] = [];
    let passedVersionOrTransforms = false;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      if (/^v\d+$/.test(seg)) {
        passedVersionOrTransforms = true;
        continue;
      }
      if (!passedVersionOrTransforms && (seg.includes(',') || /^[a-z]_[a-z0-9]+/i.test(seg))) {
        continue;
      }
      pathSegments.push(seg);
    }

    if (pathSegments.length === 0) return null;
    const fullPath = pathSegments.join('/');
    const lastDot = fullPath.lastIndexOf('.');
    return lastDot !== -1 ? fullPath.substring(0, lastDot) : fullPath;
  } catch (err) {
    console.warn('Could not extract Cloudinary public_id:', url, err);
    return null;
  }
}

async function generateSha1(str: string): Promise<string> {
  const buffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-1', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Permanently deletes an image from Cloudinary storage.
 * Works via delete_token (if available) or signed destroy API (if API Key & Secret configured).
 */
export async function deleteFromCloudinary(urlOrPublicId: string): Promise<boolean> {
  if (!urlOrPublicId) return false;

  const publicId = urlOrPublicId.includes('cloudinary.com')
    ? extractCloudinaryPublicId(urlOrPublicId)
    : urlOrPublicId;

  if (!publicId) return false;

  // 1. First attempt: Delete via delete_token (Unsigned, zero credentials required)
  const token = getDeleteToken(publicId);
  if (token) {
    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/delete_by_token`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (data.result === 'ok') {
        console.log(`[Cloudinary] Successfully deleted asset "${publicId}" using token.`);
        return true;
      }
    } catch (tokenErr) {
      console.warn(`[Cloudinary] Delete by token failed for "${publicId}", trying signed destroy:`, tokenErr);
    }
  }

  // 2. Second attempt: Signed destroy endpoint (Requires VITE_CLOUDINARY_API_KEY & VITE_CLOUDINARY_API_SECRET in .env)
  const apiKey = CLOUDINARY_API_KEY;
  const apiSecret = CLOUDINARY_API_SECRET;

  if (!apiKey || !apiSecret) {
    console.warn(
      `[Cloudinary] Image "${publicId}" removed from database. For full Cloudinary storage purge, configure VITE_CLOUDINARY_API_KEY and VITE_CLOUDINARY_API_SECRET in .env.`
    );
    return false;
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const toSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = await generateSha1(toSign);

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('timestamp', String(timestamp));
    formData.append('api_key', apiKey);
    formData.append('signature', signature);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await res.json().catch(() => ({}));
    if (data.result === 'ok' || data.result === 'not found') {
      console.log(`[Cloudinary] Asset "${publicId}" permanently destroyed.`);
      return true;
    } else {
      console.warn(`[Cloudinary] Destroy API warning for "${publicId}":`, data);
      return false;
    }
  } catch (err) {
    console.warn(`[Cloudinary] Destroy API error for "${publicId}":`, err);
    return false;
  }
}

/**
 * Permanently deletes multiple images from Cloudinary storage in parallel.
 */
export async function deleteImagesFromCloudinary(urls: (string | undefined | null)[]): Promise<void> {
  const validUrls = Array.from(
    new Set(
      urls.filter(
        (u): u is string => Boolean(u && typeof u === 'string' && u.includes('cloudinary.com'))
      )
    )
  );

  if (validUrls.length === 0) return;

  await Promise.allSettled(validUrls.map((url) => deleteFromCloudinary(url)));
}
