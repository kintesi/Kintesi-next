export const CLOUDINARY_CLOUD_NAME = 'hbs0kfi9';
export const CLOUDINARY_UPLOAD_PRESET = 'ml_default';

/**
 * Uploads an image file to Cloudinary unsigned upload preset
 * @param file File object from file input
 * @returns Promise<string> The secure HTTPS URL of the uploaded image
 */
export async function uploadToCloudinary(file: File): Promise<string> {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file (PNG, JPG, WEBP, etc.)');
  }

  // Validate size (under 10MB)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Image size should be under 10MB');
  }

  const formData = new FormData();
  formData.append('file', file);
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
  return data.secure_url;
}
