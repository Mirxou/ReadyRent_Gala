/**
 * Sovereign Image Optimizer (Phase 7).
 * Ensuring Elite Aesthetics with Investor-Grade Performance.
 */

export const IMAGE_CONFIG = {
  quality: 85,
  format: 'webp',
  placeholderSize: 10,
};

/**
 * Generates a CSS-safe blur placeholder for high-quality assets.
 * Used for the 'Glassmorphism' effect while loading.
 */
export function getBlurPlaceholder(width: number, height: number): string {
  const shimmer = (w: number, h: number) => `
    <svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <linearGradient id="g">
          <stop stop-color="#1e293b" offset="20%" />
          <stop stop-color="#334155" offset="50%" />
          <stop stop-color="#1e293b" offset="70%" />
        </linearGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="#1e293b" />
      <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
      <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
    </svg>`;

  const toBase64 = (str: string) =>
    typeof window === 'undefined'
      ? Buffer.from(str).toString('base64')
      : window.btoa(str);

  return `data:image/svg+xml;base64,${toBase64(shimmer(width, height))}`;
}

/**
 * Optimizes the image URL for the Sovereign CDN (if available) 
 * or internal Next.js optimizer.
 */
export function optimizeSovereignImage(url: string, width: number): string {
  if (!url) return '';
  
  // If it's a local path, Next.js handles it.
  if (url.startsWith('/')) {
    return url;
  }

  // Example for external CDNs (Cloudinary/Vercel)
  // For ReadyRent, we stick to Next.js Image Component which reads this.
  return url;
}
