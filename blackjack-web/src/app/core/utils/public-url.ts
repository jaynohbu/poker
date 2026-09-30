const PROD_PUBLIC_ORIGIN = 'https://rldojo.net';
const ASSET_PATH_PREFIXES = ['/blog_images/', '/profile_images/'];
const ASSET_FILE_PATTERN = /\.(png|jpe?g|gif|webp|svg|avif)(?:$|[?#])/i;

export function normalizePublicUrl(url: string): string {
  if (!url || !/^https?:\/\//i.test(url)) return url;

  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith('.cloudfront.net')) return url;
    if (isAssetUrl(parsed)) return url;

    const canonical = new URL(PROD_PUBLIC_ORIGIN);
    parsed.protocol = canonical.protocol;
    parsed.host = canonical.host;
    return parsed.toString();
  } catch {
    return url;
  }
}

function isAssetUrl(url: URL): boolean {
  return ASSET_PATH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix)) || ASSET_FILE_PATTERN.test(url.pathname);
}