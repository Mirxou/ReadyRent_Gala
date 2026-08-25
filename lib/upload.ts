// ═══════════════════════════════════════════════════════════════
// STANDARD.Rent — Cloudinary Image Upload Service
// Gracefully handles missing env vars — throws descriptive error
// ═══════════════════════════════════════════════════════════════

import { v2 as cloudinary } from 'cloudinary';

if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
} else {
  console.warn(
    '[UPLOAD] CLOUDINARY_CLOUD_NAME not set — image uploads will fail.'
  );
}

export interface UploadResult {
  url: string;
  publicId: string;
}

export async function uploadImage(
  buffer: Buffer,
  folder = 'products'
): Promise<UploadResult> {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    throw new Error('CLOUDINARY_CLOUD_NAME not configured');
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder, resource_type: 'image' },
        (error, result) => {
          if (error) return reject(error);
          resolve({
            url: result!.secure_url,
            publicId: result!.public_id,
          });
        }
      )
      .end(buffer);
  });
}

export async function deleteImage(publicId: string): Promise<void> {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    console.warn('[UPLOAD] Cannot delete — Cloudinary not configured');
    return;
  }
  await cloudinary.uploader.destroy(publicId);
  console.warn('[UPLOAD] Deleted:', publicId);
}
