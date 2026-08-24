export function getImageUrl(path: string): string {
  if (!path) return '/placeholder.png';
  if (path.startsWith('http')) return path;
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${path}`;
  }
  return path.startsWith('/') ? path : `/${path}`;
}

export function getOptimizedImageUrl(publicId: string, opts?: { width?: number; quality?: number }): string {
  if (!process.env.CLOUDINARY_CLOUD_NAME) return getImageUrl(publicId);
  const transforms = [];
  if (opts?.width) transforms.push(`w_${opts.width}`);
  if (opts?.quality) transforms.push(`q_${opts.quality}`);
  const base = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`;
  return transforms.length ? `${base}/${transforms.join(',')}/${publicId}` : `${base}/${publicId}`;
}
